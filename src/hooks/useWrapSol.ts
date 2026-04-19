// src/hooks/useWrapSol.ts
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WSOL_MINT } from "../lib/constants";
import { getATA } from "../lib/ata";

export function useWrapSol() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const wrap = async (amountLamports: bigint) => {
        if (!publicKey) throw new Error("Wallet not connected");

        const wsolAta = getATA(WSOL_MINT, publicKey, false);
        const tx = new Transaction();

        try {
            const latestBlockhash = await connection.getLatestBlockhash();
            tx.recentBlockhash = latestBlockhash.blockhash;
            tx.feePayer = publicKey;

            // 1. Check if ATA exists
            const accountInfo = await connection.getAccountInfo(wsolAta);
            if (!accountInfo) {
                tx.add(
                    Token.createAssociatedTokenAccountInstruction(
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                        TOKEN_PROGRAM_ID,
                        WSOL_MINT,
                        wsolAta,
                        publicKey,
                        publicKey
                    )
                );
            }

            // 2. Transfer Native SOL to the WSOL ATA
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: wsolAta,
                    lamports: Number(amountLamports.toString()),
                })
            );

            // 3. Sync Native (mints WSOL 1:1 for the deposited native SOL)
            const data = Buffer.alloc(1);
            data.writeUInt8(17, 0); // 17 is SyncNative instruction discriminator
            tx.add(new TransactionInstruction({
                keys: [{ pubkey: wsolAta, isSigner: false, isWritable: true }],
                programId: TOKEN_PROGRAM_ID,
                data,
            }));

            const signature = await sendTransaction(tx, connection);
            await connection.confirmTransaction(signature, "confirmed");
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

    const unwrap = async () => {
        if (!publicKey) throw new Error("Wallet not connected");
        
        const wsolAta = getATA(WSOL_MINT, publicKey, false);
        const tx = new Transaction();

        // Close the WSOL account, which sends the underlying SOL back to the owner
        tx.add(
            Token.createCloseAccountInstruction(
                TOKEN_PROGRAM_ID,
                wsolAta,
                publicKey,
                publicKey,
                []
            )
        );

        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");
        return signature;
    };

    return { wrap, unwrap };
}
