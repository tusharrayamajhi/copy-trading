// src/lib/pdas.ts
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getPlatformConfigPDA() {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("platform_config_v2")],
        PROGRAM_ID
    );
}

export function getTraderAccountPDA(traderWallet: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [traderWallet.toBuffer(), Buffer.from("trader_account")],
        PROGRAM_ID
    );
}

export function getTraderVaultPDA(traderWallet: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [traderWallet.toBuffer(), Buffer.from("trader_vault")],
        PROGRAM_ID
    );
}

export function getInvestorAccountPDA(investorWallet: PublicKey, traderAccount: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [investorWallet.toBuffer(), traderAccount.toBuffer(), Buffer.from("investor_account_v2")],
        PROGRAM_ID
    );
}

export function getSharesMintPDA(traderAccount: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [traderAccount.toBuffer(), Buffer.from("shares_mint")],
        PROGRAM_ID
    );
}