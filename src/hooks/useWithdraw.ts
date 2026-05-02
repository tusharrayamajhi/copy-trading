// src/hooks/useWithdraw.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA
} from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";

export function useWithdraw() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderAccountPDA: PublicKey, priceOverride?: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const traderData = await (program as any).account.traderAccount.fetch(traderAccountPDA);
        const traderWallet = traderData.traderWallet as PublicKey;


        const [traderAccount] = getTraderAccountPDA(traderWallet);
        const [traderVault] = getTraderVaultPDA(traderWallet);
        const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccountPDA);

        const sharesMint = traderData.traderVaultSharesMint as PublicKey;

        // Determine what asset we are receiving (what the vault currently holds)
        const currentAsset = Object.keys(traderData.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "usdc" : "sol";
        const receivingMint = currentAsset === "usdc" ? USDC_MINT : WSOL_MINT;

        let priceValue = priceOverride;
        if (!priceValue) {
            const { getSolPrice } = await import("../lib/price");
            priceValue = await getSolPrice();
        }
        const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

        try {
            const { 
                createAssociatedTokenAccountInstruction, 
                getAssociatedTokenAddressSync 
            } = await import("@solana/spl-token");
            const { Transaction } = await import("@solana/web3.js");

            const investorReceiveAta = getAssociatedTokenAddressSync(receivingMint, publicKey);
            const tx = new Transaction();

            // Check if the receive ATA exists
            const accountInfo = await program.provider.connection.getAccountInfo(investorReceiveAta);
            if (!accountInfo) {
                console.log("Creating receive ATA for investor...");
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        investorReceiveAta,
                        publicKey,
                        receivingMint
                    )
                );
            }

            // Build the withdraw instruction
            const withdrawIx = await program.methods
                .withdrawFunds(priceBN)
                .accounts({
                    investor: publicKey,
                    investorAccount,
                    traderAccount,
                    traderVault,
                    investorSharesAta: getATA(sharesMint, publicKey),
                    traderVaultSharesMint: sharesMint,
                    traderVaultTokenSol: getATA(WSOL_MINT, traderVault, true),
                    traderVaultTokenUsdc: getATA(USDC_MINT, traderVault, true),
                    investorReceiveAta: investorReceiveAta,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .instruction();
            
            tx.add(withdrawIx);

            const signature = await program.provider.sendAndConfirm!(tx);
            return signature;
        } catch (err: any) {
            console.error("Withdraw Error Details:", err);
            
            // Handle specific case where transaction actually succeeded but RPC retried
            if (err.message?.includes("already been processed")) {
                const { default: toast } = await import("react-hot-toast");
                toast.success("Withdrawal likely succeeded! Refreshing dashboard...");
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