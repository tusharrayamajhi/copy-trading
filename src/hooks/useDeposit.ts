// src/hooks/useDeposit.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { WSOL_MINT } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";

export function useDeposit() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderWallet: PublicKey, amountLamports: bigint, priceOverride?: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [traderAccount] = getTraderAccountPDA(traderWallet);
        const [traderVault] = getTraderVaultPDA(traderWallet);
        const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccount);

        // Fetch trader account data for shares mint address
        const traderData = await (program as any).account.traderAccount.fetch(traderAccount);
        const sharesMint = traderData.traderVaultSharesMint as PublicKey;

        const investorSolAta = getATA(WSOL_MINT, publicKey);
        const investorSharesAta = getATA(sharesMint, publicKey);
        const vaultSolAta = getATA(WSOL_MINT, traderVault, true);

        let priceValue = priceOverride;
        
        // Wait and retry for up to 10 seconds if price is missing or 0
        let attempts = 0;
        while ((!priceValue || priceValue <= 0) && attempts < 10) {
            console.log(`[useDeposit] Price is ${priceValue}, waiting for live market data (Attempt ${attempts + 1}/10)...`);
            const { getSolPrice } = await import("../lib/price");
            priceValue = await getSolPrice();
            
            if (!priceValue || priceValue <= 0) {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
                attempts++;
            }
        }

        if (!priceValue || priceValue <= 0) {
            throw new Error("Live market price is currently unavailable (0.00). To protect your funds, the deposit has been cancelled. Please try again in a moment.");
        }

        const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

        try {
            const tx = await program.methods
                .depositFunds(new BN(amountLamports.toString()), priceBN)
                .accounts({
                    investor: publicKey,
                    investorAccount,
                    traderAccount,
                    traderVault,
                    investorSolAta,
                    investorSharesAta,
                    traderVaultTokenSol: vaultSolAta,
                    traderVaultSharesMint: sharesMint,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any)
                .rpc();

            return tx;
        } catch (err: any) {
            console.error("Deposit Error Details:", err);
            // Catch and log specific Solana logs
            const logs = err.logs || (err.getLogs ? err.getLogs() : null);
            if (logs) {
                console.error("Transaction Logs:", logs);
                throw new Error(`Simulation failed: ${err.message}. Logs: ${logs.join('\n')}`);
            }
            throw err;
        }
    };
}