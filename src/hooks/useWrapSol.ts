// src/hooks/useWrapSol.ts
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction
} from "@solana/spl-token";
import { WSOL_MINT } from "../lib/constants";
import { getATA } from "../lib/ata";

export function useWrapSol() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const wrap = async (amount: number) => {
        if (!publicKey) throw new Error("Wallet not connected");

        const wsolAta = getATA(WSOL_MINT, publicKey, false);
        const tx = new Transaction();
        const lamports = Math.floor(amount * 1_000_000_000);

        try {
            // 1. Check if the ATA already exists
            const info = await connection.getAccountInfo(wsolAta);
            if (!info) {
                // Create ATA if it doesn't exist
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        wsolAta,
                        publicKey,
                        WSOL_MINT
                    )
                );
            }

            // 2. Transfer native SOL to the ATA address
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: wsolAta,
                    lamports: lamports,
                })
            );

            // 3. Sync the native SOL to the token account balance (this is the actual "wrap")
            tx.add(createSyncNativeInstruction(wsolAta));

            const signature = await sendTransaction(tx, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            return signature;
        } catch (error: any) {
            console.error("Wrap SOL Error Details:", error);
            if (error.logs) {
                console.error("Transaction simulation logs:", error.logs);
                throw new Error("Transaction simulation failed: " + error.logs.join(", "));
            }
            throw error;
        }
    };

    return { wrap };
}
