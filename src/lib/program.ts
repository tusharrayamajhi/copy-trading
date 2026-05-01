import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { PROGRAM_ID } from "./constants";
import idl from "../idl/defi_copy_trade.json"
export function useProgram() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    return useMemo(() => {
        if (!wallet) return null;
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });
        return new Program(idl as Idl, PROGRAM_ID, provider);
    }, [connection, wallet]);
}