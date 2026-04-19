// src/hooks/useWithdraw.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA
} from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT, PYTH_SOL_USD, PYTH_USDC_USD, PLATFORM_FEE_RECIPIENT } from "../lib/constants";

export function useWithdraw() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderWallet: PublicKey) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [traderAccount] = getTraderAccountPDA(traderWallet);
        const [traderVault] = getTraderVaultPDA(traderWallet);
        const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccount);
        const [platformConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_config")], program.programId
        );

        const traderData = await (program as any).account.traderAccount.fetch(traderAccount);
        const sharesMint = traderData.traderVaultSharesMint as PublicKey;

        const tx = await program.methods
            .withdrawFunds()
            .accounts({
                investor: publicKey,
                investorAccount,
                traderAccount,
                traderVault,
                traderVaultSharesMint: sharesMint,
                investorSharesAta: getATA(sharesMint, publicKey),
                traderVaultTokenSol: getATA(WSOL_MINT, traderVault, true),
                traderVaultTokenUsdc: getATA(USDC_MINT, traderVault, true),
                // Platform fee → your fee wallet
                platformFeeRecipientAta: getATA(WSOL_MINT, PLATFORM_FEE_RECIPIENT),
                // Trader fee → trader's personal ATA
                traderFeeRecipientAta: getATA(WSOL_MINT, traderWallet),
                investorReceiveSolAta: getATA(WSOL_MINT, publicKey),
                investorReceiveUsdcAta: getATA(USDC_MINT, publicKey),
                platformConfig,
                pythSolUsdPriceFeed: PYTH_SOL_USD,
                pythUsdcUsdPriceFeed: PYTH_USDC_USD,
                solMint: WSOL_MINT,
                usdcMint: USDC_MINT,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    };
}