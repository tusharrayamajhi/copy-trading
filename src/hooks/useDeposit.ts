// src/hooks/useDeposit.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA, getPlatformConfigPDA } from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT, PLATFORM_BANK_SOL, PLATFORM_BANK_USDC } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { toast } from "react-hot-toast";

export function useDeposit() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderWallet: PublicKey, amountLamports: bigint, priceOverride?: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const loadingToast = toast.loading("Preparing deposit...");

        try {
            const [traderAccount] = getTraderAccountPDA(traderWallet);
            const [traderVault] = getTraderVaultPDA(traderWallet);
            const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccount);
            const [platformConfigPDA] = getPlatformConfigPDA();

            // Fetch trader account data for shares mint address
            const traderData = await (program as any).account.traderAccount.fetch(traderAccount);
            const sharesMint = traderData.traderVaultSharesMint as PublicKey;

            const investorSolAta = getATA(WSOL_MINT, publicKey);
            const investorSharesAta = getATA(sharesMint, publicKey);
            const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
            const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);

            let priceValue = priceOverride;
            
            // Wait and retry for up to 10 seconds if price is missing or 0
            let attempts = 0;
            while ((!priceValue || priceValue <= 0) && attempts < 10) {
                const { getSolPrice } = await import("../lib/price");
                priceValue = await getSolPrice();
                if (!priceValue || priceValue <= 0) {
                    await new Promise(r => setTimeout(r, 1000));
                    attempts++;
                }
            }

            if (!priceValue || priceValue <= 0) {
                toast.dismiss(loadingToast);
                throw new Error("Live market price is currently unavailable.");
            }

            const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

            toast.loading("Executing deposit (Auto-swapping if needed)...", { id: loadingToast });

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
                    traderVaultTokenUsdc: vaultUsdcAta,
                    traderVaultSharesMint: sharesMint,
                    platformConfig: platformConfigPDA,
                    platformBankSol: PLATFORM_BANK_SOL,
                    platformBankUsdc: PLATFORM_BANK_USDC,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any)
                .rpc();

            toast.success("Deposit Successful! New funds are active in strategy.", { id: loadingToast });
            return tx;
        } catch (err: any) {
            toast.error(err.message || "Deposit failed", { id: loadingToast });
            console.error("Deposit Error Details:", err);
            throw err;
        }
    };
}