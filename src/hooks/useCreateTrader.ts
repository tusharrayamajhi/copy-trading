// src/hooks/useCreateTrader.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA, getSharesMintPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { WSOL_MINT, USDC_MINT } from "../lib/constants";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export function useCreateTrader() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (commissionBps: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [traderAccount] = getTraderAccountPDA(publicKey);
        const [traderVault] = getTraderVaultPDA(publicKey);
        const [sharesMint] = getSharesMintPDA(traderAccount);

        const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
        const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);

        const tx = await program.methods
            .createTrader(commissionBps)
            .accounts({
                trader: publicKey,
                traderAccount,
                traderVault,
                traderVaultTokenSol: vaultSolAta,
                traderVaultTokenUsdc: vaultUsdcAta,
                traderVaultSharesMint: sharesMint,
                solMint: WSOL_MINT,
                usdcMint: USDC_MINT,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            } as any)
            .rpc();

        return tx;
    };
}