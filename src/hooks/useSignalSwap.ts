// src/hooks/useSignalSwap.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA } from "../lib/pdas";
import { WSOL_MINT, USDC_MINT, JUPITER_V6 } from "../lib/constants";
import { PublicKey } from "@solana/web3.js";

export function useSignalSwap() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (targetAsset: "Sol" | "Usdc") => {
        if (!program || !publicKey) throw new Error("Not connected");

        const [traderAccount] = getTraderAccountPDA(publicKey);
        const [traderVault] = getTraderVaultPDA(publicKey);
        // 1. Fetch trader account to find out their current capital to trade
        const traderData = await (program as any).account.traderAccount.fetch(traderAccount);

        const inputMint = targetAsset === "Usdc" ? WSOL_MINT : USDC_MINT;
        const outputMint = targetAsset === "Usdc" ? USDC_MINT : WSOL_MINT;

        let amountIn = 0;
        // In a real scenario we'd query the exact ATA balance, but we use total pool roughly scaled
        amountIn = targetAsset === "Usdc"
            ? (traderData.totalSharesValueUsd.toNumber() * 10) // Mocking SOL amount based on value
            : (traderData.totalSharesValueUsd.toNumber());

        if (amountIn <= 0) throw new Error("No funds available in vault to trade.");

        // 2. Get Jupiter quote
        const quoteRes = await fetch(
            `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amountIn}&swapMode=ExactIn`
        );
        const quote = await quoteRes.json();

        if (quote.error) {
            throw new Error(`Jupiter API Error: ${quote.error}. (Note: Jupiter does NOT support Solana Devnet tokens!)`);
        }

        // 3. Get swap transaction from Jupiter
        const swapRes = await fetch("https://quote-api.jup.ag/v6/swap-instructions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quoteResponse: quote,
                userPublicKey: traderVault.toBase58(),
                wrapAndUnwrapSol: false,
            }),
        });
        const swapJson = await swapRes.json();
        if (swapJson.error) {
            throw new Error(`Jupiter Swap Error: ${swapJson.error}`);
        }

        const { swapInstruction, accounts } = swapJson;

        // 4. Call your program's signal_swap with Jupiter's instruction data
        const tx = await program.methods
            .signalSwap(
                { [targetAsset.toLowerCase()]: {} },
                new anchor.BN(quote.inAmount),
                Buffer.from(swapInstruction.data, "base64")
            )
            .accounts({
                trader: publicKey,
                traderAccount,
                traderVault,
                jupiterProgram: JUPITER_V6,
            })
            .remainingAccounts(
                accounts.map((a: any) => ({
                    pubkey: new PublicKey(a.pubkey),
                    isSigner: a.isSigner,
                    isWritable: a.isWritable,
                }))
            )
            .rpc();

        return tx;
    };
}