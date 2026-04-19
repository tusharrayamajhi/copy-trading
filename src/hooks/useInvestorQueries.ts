// src/hooks/useInvestorQueries.ts
import { useEffect, useState } from "react";
import { useProgram } from "../lib/program";
import { PublicKey } from "@solana/web3.js";

export type InvestorInfo = {
    publicKey: string;
    account: any;
};

export function useMyInvestments(walletPubkey: PublicKey | null) {
    const program = useProgram();
    const [investments, setInvestments] = useState<InvestorInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvestments = async () => {
        if (!program || !walletPubkey) {
            setInvestments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch all InvestorAccount instances matching the connected wallet
            const accounts = await (program.account as any).investorAccount.all([
                {
                    memcmp: {
                        offset: 8, // Skip 8 byte discriminator
                        bytes: walletPubkey.toBase58(),
                    },
                },
            ]);
            
            setInvestments(accounts.map((a: any) => ({
                publicKey: a.publicKey.toBase58(),
                account: a.account,
            })));
        } catch (err) {
            console.error("Failed to fetch investments", err);
            setInvestments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, [program, walletPubkey?.toBase58()]);

    return { investments, loading, refetch: fetchInvestments };
}
