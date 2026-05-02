import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA } from "../lib/pdas";
import { WSOL_MINT, USDC_MINT, PLATFORM_CONFIG_PDA, PLATFORM_BANK_SOL, PLATFORM_BANK_USDC } from "../lib/constants";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getATA } from "../lib/ata";
import toast from "react-hot-toast";

export function useSignalSwap() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (targetAsset: "Sol" | "Usdc", priceOverride?: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [traderAccount] = getTraderAccountPDA(publicKey);
        const [traderVault] = getTraderVaultPDA(publicKey);

        // Vault balances
        const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
        const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);

        let amountIn = new anchor.BN(0);

        if (targetAsset === "Usdc") {
            const solBalance = await program.provider.connection.getTokenAccountBalance(vaultSolAta);
            amountIn = new anchor.BN(solBalance.value.amount);
            if (amountIn.eqn(0)) throw new Error("No SOL in vault to swap. Please wait for investor SOL deposits.");
        } else {
            const usdcBalance = await program.provider.connection.getTokenAccountBalance(vaultUsdcAta);
            amountIn = new anchor.BN(usdcBalance.value.amount);
            if (amountIn.eqn(0)) throw new Error("No USDC in vault to swap. Shift to USDC first or wait for trades.");
        }

        try {
            let priceValue = priceOverride;
            
            // Wait and retry for up to 10 seconds if price is missing or 0
            let attempts = 0;
            while ((!priceValue || priceValue <= 0) && attempts < 10) {
                console.log(`[useSignalSwap] Price is ${priceValue}, waiting for live market data (Attempt ${attempts + 1}/10)...`);
                const { getSolPrice } = await import("../lib/price");
                priceValue = await getSolPrice();
                
                if (!priceValue || priceValue <= 0) {
                    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
                    attempts++;
                }
            }

            if (!priceValue || priceValue <= 0) {
                throw new Error("Unable to fetch a valid SOL price for swap. Please try again in a few seconds.");
            }
            const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

            const tx = await program.methods
                .signalSwap(
                    targetAsset === "Sol" ? { sol: {} } : { usdc: {} },
                    amountIn,
                    priceBN
                )
                .accounts({
                    trader: publicKey,
                    traderAccount,
                    traderVault,
                    traderVaultTokenSol: vaultSolAta,
                    traderVaultTokenUsdc: vaultUsdcAta,
                    platformConfig: PLATFORM_CONFIG_PDA,
                    platformBankSol: PLATFORM_BANK_SOL,
                    platformBankUsdc: PLATFORM_BANK_USDC,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                } as any)
                .rpc();

            return tx;
        } catch (err: any) {
            console.error("Swap Error Details:", err);

            // Handle specific case where transaction actually succeeded but RPC retried
            if (err.message?.includes("already been processed")) {
                toast.success("Transaction likely succeeded! Refreshing status...");
                return "ALREADY_PROCESSED";
            }

            const logs = err.logs || (err.getLogs ? err.getLogs() : null);
            if (logs) {
                console.error("Transaction Logs:", logs);
                throw new Error(`Simulation failed: ${err.message}. Logs: ${logs.join('\n')}`);
            }
            throw err;
        }
    };
}