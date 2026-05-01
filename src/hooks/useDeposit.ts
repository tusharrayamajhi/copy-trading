// src/hooks/useDeposit.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT, PYTH_SOL_USD } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";

export function useDeposit() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderWallet: PublicKey, amountLamports: bigint) => {
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

        const { getSolPrice } = await import("../lib/price");
        const priceValue = await getSolPrice();
        const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

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
    };
}