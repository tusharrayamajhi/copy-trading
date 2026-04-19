// src/hooks/useTraderQueries.ts
import { useEffect, useState } from "react";
import { useProgram } from "../lib/program";
import { PublicKey } from "@solana/web3.js";
import { getTraderAccountPDA } from "../lib/pdas";

export type TraderInfo = {
    publicKey: string;
    account: any;
};

export function useAllTraders() {
    const program = useProgram();
    const [traders, setTraders] = useState<TraderInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!program) return;
        const fetchTraders = async () => {
            try {
                const accounts = await (program.account as any).traderAccount.all();
                setTraders(accounts.map((a: any) => ({
                    publicKey: a.account.traderWallet.toBase58(),
                    account: a.account,
                })));
            } catch (err) {
                console.error("Failed to fetch traders", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTraders();
    }, [program]);

    return { traders, loading };
}

export function useTraderAccount(traderWallet: PublicKey | null) {
    const program = useProgram();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const refetch = async () => {
        if (!program || !traderWallet) {
            setData(null);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [pda] = getTraderAccountPDA(traderWallet);
            const accountData = await (program.account as any).traderAccount.fetchNullable(pda);
            setData(accountData);
        } catch (error) {
            console.error("Failed to fetch trader account:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [program, traderWallet?.toBase58()]);

    return { data, loading, refetch };
}
