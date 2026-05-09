// src/hooks/useWithdraw.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA, getPlatformConfigPDA
} from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT, PLATFORM_BANK_SOL, PLATFORM_BANK_USDC } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";
import { toast } from "react-hot-toast";

export function useWithdraw() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderAccountPDA: PublicKey, priceOverride?: number) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const loadingToast = toast.loading("Preparing withdrawal...");

        try {
            const traderData = await (program as any).account.traderAccount.fetch(traderAccountPDA);
            const traderWallet = traderData.traderWallet as PublicKey;
            
            // Get Platform Config to find fee recipient
            const [platformConfigPDA] = getPlatformConfigPDA();
            const platformConfigData = await (program as any).account.platformConfig.fetch(platformConfigPDA);
            const platformFeeRecipient = platformConfigData.platformFeeRecipient as PublicKey;

            const [traderAccount] = getTraderAccountPDA(traderWallet);
            const [traderVault] = getTraderVaultPDA(traderWallet);
            const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccountPDA);

            const sharesMint = traderData.traderVaultSharesMint as PublicKey;

            // We ALWAYS withdraw in SOL (WSOL) as requested, which we then unwrap
            const receivingMint = WSOL_MINT;

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
                throw new Error("Unable to fetch a valid SOL price for withdrawal.");
            }
            const priceBN = new anchor.BN(Math.floor(priceValue * 1e6));

            const {
                createAssociatedTokenAccountInstruction,
                getAssociatedTokenAddressSync,
                createCloseAccountInstruction
            } = await import("@solana/spl-token");
            const { Transaction } = await import("@solana/web3.js");

            const investorReceiveAta = getAssociatedTokenAddressSync(receivingMint, publicKey);
            const traderReceiveAta = getAssociatedTokenAddressSync(receivingMint, traderWallet);
            const platformReceiveAta = getAssociatedTokenAddressSync(receivingMint, platformFeeRecipient);

            const tx = new Transaction();

            // 1. Ensure ATAs exist for all recipients (Investor, Trader, Platform)
            const recipients = [
                { wallet: publicKey, ata: investorReceiveAta },
                { wallet: traderWallet, ata: traderReceiveAta },
                { wallet: platformFeeRecipient, ata: platformReceiveAta }
            ];

            for (const rec of recipients) {
                const info = await program.provider.connection.getAccountInfo(rec.ata);
                if (!info) {
                    tx.add(createAssociatedTokenAccountInstruction(publicKey, rec.ata, rec.wallet, receivingMint));
                }
            }

            toast.loading("Calculating profit & fees...", { id: loadingToast });

            // 2. Build the withdraw instruction
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
                    platformConfig: platformConfigPDA,
                    platformBankSol: PLATFORM_BANK_SOL,
                    platformBankUsdc: PLATFORM_BANK_USDC,
                    traderReceiveSolAta: traderReceiveAta,
                    platformFeeReceiveSolAta: platformReceiveAta,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .instruction();

            tx.add(withdrawIx);

            // 3. UNWRAP: Close WSOL ATAs to send native SOL
            // This satisfies the "send sol not wsol" requirement for the investor
            tx.add(createCloseAccountInstruction(investorReceiveAta, publicKey, publicKey));
            
            // Note: We cannot unwrap trader/platform ATAs here because we don't have their signatures.
            // They will receive WSOL which they can unwrap themselves.

            toast.loading("Executing transaction (SOL conversion active)...", { id: loadingToast });

            const signature = await program.provider.sendAndConfirm!(tx);
            
            toast.success("Withdrawal Successful! SOL sent to your wallet.", { id: loadingToast });
            return signature;
        } catch (err: any) {
            toast.error(err.message || "Withdrawal failed", { id: loadingToast });
            console.error("Withdraw Error Details:", err);

            if (err.message?.includes("already been processed")) {
                return "ALREADY_PROCESSED";
            }
            throw err;
        }
    };
}