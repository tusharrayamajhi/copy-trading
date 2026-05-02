import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/program";
import { getSharesMintPDA, getTraderVaultPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { WSOL_MINT, USDC_MINT } from "../lib/constants";

export type InvestmentLiveStats = {
    currentValue: number; // Net Value (after commission)
    grossValue: number;   // Total value of ownership before commission
    pnl: number;
    pnlPercent: number;
    shares: number;
    ownershipPercentage: number;
    // For Breakdown UI
    vaultSol: number;
    vaultUsdc: number;
    totalShares: number;
    initialValue: number;
};

export function useInvestmentLiveStats(investorWallet: PublicKey | null, investments: any[], traders: any[], solPrice: number) {
    const { connection } = useConnection();
    const program = useProgram();
    const [stats, setStats] = useState<Record<string, InvestmentLiveStats>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!connection || !program || !investorWallet || investments.length === 0 || !solPrice) {
            return;
        }

        const fetchLiveStats = async () => {
            if (document.hidden) return;

            try {
                setLoading(true);
                const { AccountLayout, MintLayout } = await import("@solana/spl-token");
                const newStats: Record<string, InvestmentLiveStats> = {};

                // Collect all accounts we need to fetch
                const accountRequests: { pubkey: PublicKey, type: 'token' | 'mint' | 'trader' | 'investor', invKey: string, meta: any }[] = [];

                for (const inv of investments) {
                    const trader = traders.find(t => t.publicKey === inv.linkedTraderPubkey);
                    if (!trader) continue;

                    const traderAccountPubkey = new PublicKey(trader.publicKey);
                    const investorAccountPubkey = new PublicKey(inv.publicKey);

                    // DERIVE addresses directly to ensure they match the contract's expected PDAs
                    const traderWallet = new PublicKey(trader.account.traderWallet);
                    const [traderVault] = getTraderVaultPDA(traderWallet);
                    const [sharesMint] = getSharesMintPDA(traderAccountPubkey);

                    const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
                    const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);
                    const investorSharesAta = getATA(sharesMint, investorWallet);

                    accountRequests.push(
                        { pubkey: vaultSolAta, type: 'token', invKey: inv.publicKey, meta: 'vaultSol' },
                        { pubkey: vaultUsdcAta, type: 'token', invKey: inv.publicKey, meta: 'vaultUsdc' },
                        { pubkey: sharesMint, type: 'mint', invKey: inv.publicKey, meta: 'sharesMint' },
                        { pubkey: investorSharesAta, type: 'token', invKey: inv.publicKey, meta: 'investorShares' },
                        { pubkey: traderAccountPubkey, type: 'trader', invKey: inv.publicKey, meta: 'traderAcc' },
                        { pubkey: investorAccountPubkey, type: 'investor', invKey: inv.publicKey, meta: 'investorAcc' }
                    );
                }

                if (accountRequests.length === 0) return;

                // Batch fetch all accounts
                const accountsInfo = await connection.getMultipleAccountsInfo(accountRequests.map(r => r.pubkey));

                // Process results
                const resultsByInv: Record<string, any> = {};

                accountRequests.forEach((req, idx) => {
                    const info = accountsInfo[idx];
                    if (!resultsByInv[req.invKey]) resultsByInv[req.invKey] = {};

                    if (!info) {
                        console.warn(`[LiveStats] Account not found: ${req.pubkey.toBase58()} (type: ${req.type}, meta: ${req.meta})`);
                        resultsByInv[req.invKey][req.meta] = null;
                        return;
                    }

                    try {
                        if (req.type === 'token') {
                            const decoded = AccountLayout.decode(info.data);
                            // Robust BigInt handling
                            const amount = BigInt(decoded.amount as any);
                            resultsByInv[req.invKey][req.meta] = amount;
                        } else if (req.type === 'mint') {
                            const decoded = MintLayout.decode(info.data);
                            // Robust BigInt handling
                            const supply = BigInt(decoded.supply as any);
                            resultsByInv[req.invKey][req.meta] = supply;
                        } else if (req.type === 'trader') {
                            const decoded = (program.account.traderAccount as any).coder.accounts.decode("TraderAccount", info.data);
                            resultsByInv[req.invKey][req.meta] = decoded;
                        } else if (req.type === 'investor') {
                            const decoded = (program.account.investorAccount as any).coder.accounts.decode("InvestorAccount", info.data);
                            resultsByInv[req.invKey][req.meta] = decoded;
                        }
                    } catch (decodeErr) {
                        console.error(`[LiveStats] Decoding failed for ${req.meta}:`, decodeErr);
                        resultsByInv[req.invKey][req.meta] = null;
                    }
                });

                // Final calculation
                for (const inv of investments) {
                    const res = resultsByInv[inv.publicKey];
                    if (!res) continue;

                    const traderData = res.traderAcc;
                    const investorData = res.investorAcc;

                    if (!traderData || !investorData) {
                        console.warn(`[LiveStats] Missing critical account data for ${inv.publicKey}`);
                        continue;
                    }

                    // Log critical addresses for Explorer verification
                    console.log(`[PnL Explorer Verification] Investment: ${inv.publicKey}`, {
                        vaultSolAta: accountRequests.find(r => r.invKey === inv.publicKey && r.meta === 'vaultSol')?.pubkey.toBase58(),
                        vaultUsdcAta: accountRequests.find(r => r.invKey === inv.publicKey && r.meta === 'vaultUsdc')?.pubkey.toBase58(),
                        sharesMint: accountRequests.find(r => r.invKey === inv.publicKey && r.meta === 'sharesMint')?.pubkey.toBase58(),
                        investorSharesAta: accountRequests.find(r => r.invKey === inv.publicKey && r.meta === 'investorShares')?.pubkey.toBase58(),
                    });

                    const vaultSol = (Number(res.vaultSol) || 0) / 1e9;
                    const vaultUsdc = (Number(res.vaultUsdc) || 0) / 1e6;
                    const totalShares = Number(res.sharesMint) || 0;
                    const myShares = Number(res.investorShares) || 0;

                    const effectivePrice = solPrice || 0;
                    const totalVaultValue = (vaultSol * effectivePrice) + vaultUsdc;

                    let myGrossValue = 0;
                    if (totalShares > 0 && myShares > 0) {
                        myGrossValue = (myShares / totalShares) * totalVaultValue;
                    }

                    const initialValue = investorData.initialDepositUsdValue.toNumber() / 1e6;

                    let myNetValue = myGrossValue;
                    if (myGrossValue > initialValue) {
                        const profit = myGrossValue - initialValue;
                        const commissionBps = traderData.commissionPercentage || 0;
                        const commissionUsd = (profit * commissionBps) / 10000;
                        myNetValue = myGrossValue - commissionUsd;
                    }

                    const pnl = myNetValue - initialValue;
                    const pnlPercent = initialValue > 0 ? (pnl / initialValue) * 100 : 0;

                    console.log(`[PnL Math Final] ${inv.publicKey}:`, {
                        vaultSol,
                        vaultUsdc,
                        totalShares,
                        myShares,
                        totalVaultValue,
                        myGrossValue,
                        initialValue,
                        pnl,
                        solPrice: effectivePrice
                    });

                    newStats[inv.publicKey] = {
                        currentValue: myNetValue,
                        grossValue: myGrossValue,
                        pnl,
                        pnlPercent,
                        shares: myShares / 1e6,
                        ownershipPercentage: totalShares > 0 ? (myShares / totalShares) * 100 : 0,
                        vaultSol,
                        vaultUsdc,
                        totalShares: totalShares / 1e6,
                        initialValue
                    };
                }

                setStats(newStats as any);
            } catch (error) {
                console.error("Failed to fetch live investment stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveStats();
        const interval = setInterval(fetchLiveStats, 10000);
        return () => clearInterval(interval);
    }, [connection, program, investorWallet?.toBase58(), investments.length, traders.length, solPrice]);

    return { stats, loading };
}
