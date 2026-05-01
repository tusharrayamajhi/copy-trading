import { useProgram } from "../lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { PLATFORM_FEE_RECIPIENT } from "../lib/constants";

export function useInitializePlatform() {
    const program = useProgram();
    const { publicKey } = useWallet();

    return async () => {
        if (!program || !publicKey) throw new Error("Wallet not connected");

        const [platformConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_config")],
            program.programId
        );

        console.log("Initializing platform... Config:", platformConfig.toBase58());

        const tx = await program.methods
            .initializePlatform(
                500 // 5% platform fee (bps)
            )
            .accounts({
                admin: publicKey,
                platformConfig: platformConfig,
                platformFeeRecipient: PLATFORM_FEE_RECIPIENT,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    };
}
