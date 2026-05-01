import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA } from "../lib/pdas";
import { WSOL_MINT, USDC_MINT, PLATFORM_CONFIG_PDA, PLATFORM_BANK_SOL, PLATFORM_BANK_USDC } from "../lib/constants";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getATA } from "../lib/ata";

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

        try {
            if (targetAsset === "Usdc") {
                const solBalance = await program.provider.connection.getTokenAccountBalance(vaultSolAta);
                amountIn = new anchor.BN(solBalance.value.amount);
                if (amountIn.eqn(0)) throw new Error("No SOL in vault to swap");
            } else {
                const usdcBalance = await program.provider.connection.getTokenAccountBalance(vaultUsdcAta);
                amountIn = new anchor.BN(usdcBalance.value.amount);
                if (amountIn.eqn(0)) throw new Error("No USDC in vault to swap");
            }
        } catch (e: any) {
            throw new Error("Vault is empty. Please wait for investor deposits before trading.");
        }

        try {
            let priceValue = priceOverride;
            if (!priceValue) {
                const { getSolPrice } = await import("../lib/price");
                priceValue = await getSolPrice();
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
            const logs = err.logs || (err.getLogs ? err.getLogs() : null);
            if (logs) {
                console.error("Transaction Logs:", logs);
                throw new Error(`Simulation failed: ${err.message}. Logs: ${logs.join('\n')}`);
            }
            throw err;
        }
    };
}