import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { getTraderAccountPDA, getTraderVaultPDA } from "../lib/pdas";
import { WSOL_MINT, USDC_MINT, PYTH_SOL_USD } from "../lib/constants";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getATA } from "../lib/ata";

export function useSignalSwap() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async (targetAsset: "Sol" | "Usdc") => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [traderAccount] = getTraderAccountPDA(publicKey);
        const [traderVault] = getTraderVaultPDA(publicKey);

        // Fetch trader state
        const traderData = await (program as any).account.traderAccount.fetch(traderAccount);
        
        // Derive Platform Config and Bank ATAs
        const [platformConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_config")],
            program.programId
        );
        const platformBankSol = getATA(WSOL_MINT, platformConfig, true);
        const platformBankUsdc = getATA(USDC_MINT, platformConfig, true);

        // Fetch vault balances to know how much to swap
        const vaultSolAta = getATA(WSOL_MINT, traderVault, true);
        const vaultUsdcAta = getATA(USDC_MINT, traderVault, true);

        let amountIn = new anchor.BN(0);
        
        // Simple logic for swapping ALL of the current asset
        try {
            if (targetAsset === "Usdc") {
                // Swapping SOL -> USDC
                const solBalance = await program.provider.connection.getTokenAccountBalance(vaultSolAta);
                amountIn = new anchor.BN(solBalance.value.amount);
                if (amountIn.eqn(0)) throw new Error("No SOL in vault to swap");
            } else {
                // Swapping USDC -> SOL
                const usdcBalance = await program.provider.connection.getTokenAccountBalance(vaultUsdcAta);
                amountIn = new anchor.BN(usdcBalance.value.amount);
                if (amountIn.eqn(0)) throw new Error("No USDC in vault to swap");
            }
        } catch (e: any) {
            if (e.message.includes("could not find account")) {
                throw new Error("Vault is empty. Please wait for investor deposits before trading.");
            }
            throw e;
        }

        console.log(`Executing Swap to ${targetAsset}. Amount In: ${amountIn.toString()}`);

        try {
            const tx = await program.methods
                .signalSwap(
                    targetAsset === "Sol" ? { sol: {} } : { usdc: {} },
                    amountIn
                )
                .accounts({
                    trader: publicKey,
                    traderAccount,
                    traderVault,
                    traderVaultTokenSol: vaultSolAta,
                    traderVaultTokenUsdc: vaultUsdcAta,
                    platformConfig,
                    platformBankSol,
                    platformBankUsdc,
                    pythSolUsdPriceFeed: PYTH_SOL_USD,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Swap Successful! TX:", tx);
            return tx;
        } catch (err) {
            console.error("Program Call Failed:", err);
            throw err;
        }
    };
}