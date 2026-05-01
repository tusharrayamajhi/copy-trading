// src/hooks/useWithdraw.ts
import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    getTraderAccountPDA, getTraderVaultPDA, getInvestorAccountPDA
} from "../lib/pdas";
import { getATA } from "../lib/ata";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT, PYTH_SOL_USD, PYTH_USDC_USD } from "../lib/constants";
import * as anchor from "@coral-xyz/anchor";

export function useWithdraw() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (traderAccountPDA: PublicKey) => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const traderData = await (program as any).account.traderAccount.fetch(traderAccountPDA);
        const traderWallet = traderData.traderWallet as PublicKey;

        const [traderAccount] = getTraderAccountPDA(traderWallet); // Same as traderAccountPDA
        const [traderVault] = getTraderVaultPDA(traderWallet);
        const [investorAccount] = getInvestorAccountPDA(publicKey, traderAccountPDA);
        const [platformConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_config")], program.programId
        );

        const sharesMint = traderData.traderVaultSharesMint as PublicKey;
        
        // Determine what asset we are receiving (what the vault currently holds)
        const currentAsset = Object.keys(traderData.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "usdc" : "sol";
        const receivingMint = currentAsset === "usdc" ? USDC_MINT : WSOL_MINT;

        const tx = await program.methods
            .withdrawFunds()
            .accounts({
                investor: publicKey,
                investorAccount,
                traderAccount,
                traderVault,
                investorSharesAta: getATA(sharesMint, publicKey),
                traderVaultSharesMint: sharesMint,
                traderVaultTokenSol: getATA(WSOL_MINT, traderVault, true),
                traderVaultTokenUsdc: getATA(USDC_MINT, traderVault, true),
                investorReceiveAta: getATA(receivingMint, publicKey),
                pythSolUsdPriceFeed: PYTH_SOL_USD,
                pythUsdcUsdPriceFeed: PYTH_USDC_USD,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            })
            .rpc();

        return tx;
    };
}