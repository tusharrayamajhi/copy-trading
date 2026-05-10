import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import idl from "@/src/idl/defi_copy_trade.json"
import { PROGRAM_ID } from "@/src/lib/constants";
import { getTraderAccountPDA, getTraderVaultPDA } from "@/src/lib/pdas";
import { AssetType } from "@/src/generated/prisma";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

// Helper to get Program on server without a wallet
const getProgram = () => {
  const provider = new AnchorProvider(connection, {} as any, { commitment: "confirmed" });
  return new Program(idl as Idl, PROGRAM_ID, provider);
};

export async function POST(req: Request) {
  try {
    const { transactions, wallet, isTrader } = await req.json();
    console.log(`[Sync] Starting sync for wallet: ${wallet} (isTrader: ${isTrader})`);

    const session = await getSession();
    if (!session) {
      console.warn(`[Sync] Unauthorized access attempt for wallet: ${wallet}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Sync] Session verified for user: ${session.userId}`);

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    let enrichedTransactions = [...transactions];

    // Off-chain Synchronization logic
    if (isTrader) {
      // Find the user and profile
      let traderUser = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        include: { traderProfile: { include: { vaults: true } } },
      });

      // Self-heal: If user or profile doesn't exist, create it
      if (!traderUser) {
        console.log(`[Sync] User not found in DB, creating new user record...`);
        traderUser = await prisma.user.create({
          data: { walletAddress: wallet },
          include: { traderProfile: { include: { vaults: true } } },
        });
      }

      if (!traderUser) {
        return NextResponse.json({ error: "Failed to create or find trader user" }, { status: 500 });
      }

      if (!traderUser.traderProfile) {
        console.log(`[Sync] TraderProfile missing, creating for user: ${traderUser.id}`);
        await prisma.traderProfile.create({
          data: { userId: traderUser.id }
        });
        // Refetch with new profile
        traderUser = await prisma.user.findUnique({
          where: { id: traderUser.id },
          include: { traderProfile: { include: { vaults: true } } }
        }) as any;
      }

      const traderProfile = traderUser!.traderProfile!;
      const traderProfileId = traderProfile.id;
      let vault = traderProfile.vaults[0];

      // Fetch current On-Chain state to keep DB in sync
      try {
        const program = getProgram();
        const [accountPda] = getTraderAccountPDA(new PublicKey(wallet));
        const [vaultPda] = getTraderVaultPDA(new PublicKey(wallet));
        
        console.log(`[Sync] Derived PDAs: Account=${accountPda.toBase58()}, Vault=${vaultPda.toBase58()}`);
        console.log(`[Sync] Fetching on-chain account data...`);

        const onChainAccount = await (program.account as any).traderAccount.fetchNullable(accountPda);

        if (onChainAccount) {
          console.log(`[Sync] Found on-chain account, updating vault records...`);
          
          const vaultData = {
            traderId: traderProfileId,
            vaultPda: vaultPda.toBase58(),
            solAta: onChainAccount.traderVaultTokenSol.toBase58(),
            usdcAta: onChainAccount.traderVaultTokenUsdc.toBase58(),
            sharesMint: onChainAccount.traderVaultSharesMint.toBase58(),
            totalShares: Number(onChainAccount.totalShares || 0),
            totalSharesValueUsd: onChainAccount.totalSharesValueUsd.toNumber() / 1e6,
            currentAsset: (Object.keys(onChainAccount.currentAsset || {})[0]?.toUpperCase() === "USDC" ? "USDC" : "SOL") as any,
          };

          if (!vault) {
            console.log(`[Sync] Creating new vault record: ${vaultPda.toBase58()}`);
            vault = await prisma.vault.create({
              data: vaultData
            });
          } else {
            console.log(`[Sync] Updating existing vault record: ${vault.id}`);
            vault = await prisma.vault.update({
              where: { id: vault.id },
              data: vaultData
            });
          }
        } else {
          console.log(`[Sync] No on-chain trader account found (Vault not initialized yet).`);
        }
      } catch (e) {
        console.error("[Sync Error] Failed to sync vault state:", e);
      }

      if (vault) {
        console.log(`[Sync] Synchronizing ${transactions.length} transactions for vault: ${vault.id}`);
        // Sync new transactions into Prisma (process oldest first to ensure PnL is calculated linearly)
        const sorted = [...transactions].reverse();

        for (const tx of sorted) {
          if (tx.status !== "success") continue;
          if (tx.action !== "SignalSwap" && tx.action !== "DepositFunds" && tx.action !== "WithdrawFunds") continue;

          // Check if it already exists
          const exists = await prisma.transaction.findUnique({
            where: { txSignature: tx.signature },
          });

          if (!exists) {
            console.log(`[Sync] Saving new transaction: ${tx.action} (${tx.signature.slice(0,8)}...)`);
            let pnlUsd = 0;
            let pnlPercentage = 0;
            let previousSwapPriceUsd = null;

            const typeMap: Record<string, "SWAP" | "DEPOSIT" | "WITHDRAW"> = {
              SignalSwap: "SWAP",
              DepositFunds: "DEPOSIT",
              WithdrawFunds: "WITHDRAW",
            };

            if (tx.action === "SignalSwap") {
              const lastSwap = await prisma.transaction.findFirst({
                where: { vaultId: vault.id, type: "SWAP" },
                orderBy: { timestamp: "desc" },
              });

              if (lastSwap) {
                previousSwapPriceUsd = lastSwap.priceUsd;
                // If they are swapping FROM SOL TO USDC, they realize PnL relative to their last entry
                if (tx.details?.toAsset === "USDC" && tx.details?.asset === "SOL") {
                  pnlPercentage = ((tx.details.price - lastSwap.priceUsd) / lastSwap.priceUsd) * 100;
                  pnlUsd = (tx.details.amount || 0) * (tx.details.price - lastSwap.priceUsd);

                  // Update Trader stats
                  if (pnlUsd > 0) {
                    await prisma.traderProfile.update({
                      where: { id: traderProfileId },
                      data: { lifetimeProfitUsd: { increment: pnlUsd } }
                    });
                  } else {
                    await prisma.traderProfile.update({
                      where: { id: traderProfileId },
                      data: { lifetimeLossUsd: { increment: Math.abs(pnlUsd) } }
                    });
                  }
                }
              }

              // Update Vault current asset
              await prisma.vault.update({
                where: { id: vault.id },
                data: { currentAsset: tx.details?.asset === "USDC" ? "USDC" : "SOL" }
              });
            }

            // Create in DB
            await prisma.transaction.create({
              data: {
                vaultId: vault.id,
                type: typeMap[tx.action],
                amount: tx.details?.amount || 0,
                asset: tx.details?.asset === "USDC" ? "USDC" : "SOL",
                priceUsd: tx.details?.price || 0,
                txSignature: tx.signature,
                previousSwapPriceUsd,
                pnlUsd,
                pnlPercentage,
                timestamp: tx.timestamp ? new Date(tx.timestamp * 1000) : new Date(),
              },
            });
          }
        }

        // Final Vault Health Sync: Fetch live totals from Solana to ensure accuracy
        try {
          const [supply, solBal, usdcBal] = await Promise.all([
            connection.getTokenSupply(new PublicKey(vault.sharesMint)),
            connection.getTokenAccountBalance(new PublicKey(vault.solAta)),
            connection.getTokenAccountBalance(new PublicKey(vault.usdcAta)),
          ]);

          const totalShares = Number(supply.value.amount) / Math.pow(10, supply.value.decimals);
          const solAmount = Number(solBal.value.amount) / 1e9;
          const usdcAmount = Number(usdcBal.value.amount) / 1e6;

          // Fetch current price for valuation
          const priceRes = await fetch(`${req.url.split("/api/")[0]}/api/price/sol`);
          const { price } = await priceRes.json();
          const totalSharesValueUsd = (solAmount * (price || 0)) + usdcAmount;

          await prisma.vault.update({
            where: { id: vault.id },
            data: {
              totalShares,
              totalSharesValueUsd,
              currentAsset: solAmount > 0.01 && usdcAmount < 0.01 ? "SOL" : "USDC"
            }
          });
        } catch (e) {
          console.error("Vault health sync failed:", e);
        }

        // Now fetch all DB transactions for this vault to map the PnL back to the frontend's response
        const dbTxs = await prisma.transaction.findMany({
          where: { vaultId: vault.id },
        });

        // Enrich the returned transactions
        enrichedTransactions = transactions.map((tx) => {
          const dbMatch = dbTxs.find((d) => d.txSignature === tx.signature);
          if (dbMatch) {
            return {
              ...tx,
              details: {
                ...tx.details,
                pnlUsd: dbMatch.pnlUsd,
                pnlPercentage: dbMatch.pnlPercentage,
                previousSwapPriceUsd: dbMatch.previousSwapPriceUsd,
              },
            };
          }
          return tx;
        });
      }
    } else {
      // Investor view: we dynamically assign their share of the PnL
      const investorProfile = await prisma.investorProfile.findFirst({
        where: { user: { walletAddress: session.walletAddress } },
        include: { investments: { include: { vault: true } } },
      });

      if (investorProfile) {
        // Fetch all DB transactions that match the requested signatures (which are vault transactions)
        const signatures = transactions.map((t) => t.signature);
        const dbTxs = await prisma.transaction.findMany({
          where: { txSignature: { in: signatures } },
        });

        enrichedTransactions = transactions.map((tx) => {
          const dbMatch = dbTxs.find((d) => d.txSignature === tx.signature);
          if (dbMatch) {
            // Find if investor is in this vault
            const investment = investorProfile.investments.find((inv) => inv.vaultId === dbMatch.vaultId);

            // Calculate investor's cut based on their shares vs total shares
            const shareRatio = investment && investment.sharesOwned > 0 && investment.vault.totalShares > 0
              ? (investment.sharesOwned / investment.vault.totalShares)
              : (investment && investment.sharesOwned > 0 ? 1 : 0);

            return {
              ...tx,
              details: {
                ...tx.details,
                pnlUsd: dbMatch.pnlUsd ? dbMatch.pnlUsd * shareRatio : null,
                pnlPercentage: dbMatch.pnlPercentage,
                previousSwapPriceUsd: dbMatch.previousSwapPriceUsd,
              },
            };
          }
          return tx;
        });
      }
    }

    return NextResponse.json(enrichedTransactions);
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
