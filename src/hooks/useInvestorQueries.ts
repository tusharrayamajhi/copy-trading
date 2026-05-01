import { useEffect, useState } from "react";
import { useProgram } from "../lib/program";
import { PublicKey } from "@solana/web3.js";
import { getInvestorAccountPDA } from "../lib/pdas";

export type InvestorInfo = {
    publicKey: string;
    linkedTraderPubkey: string;
    account: any;
};

export function useMyInvestments(walletPubkey: PublicKey | null, traders: any[]) {
    const program = useProgram();
    const [investments, setInvestments] = useState<InvestorInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvestments = async () => {
        if (!program || !walletPubkey) {
            setInvestments([]);
            setLoading(false);
            return;
        }
        if (traders.length === 0) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const pdas = traders.map(t => getInvestorAccountPDA(walletPubkey, new PublicKey(t.publicKey))[0]);
            
            // fetchMultiple returns null for accounts that don't exist
            const accounts = await (program.account as any).investorAccount.fetchMultiple(pdas);
            
            const foundInvestments: InvestorInfo[] = [];
            for (let i = 0; i < accounts.length; i++) {
                if (accounts[i]) {
                    foundInvestments.push({
                        publicKey: pdas[i].toBase58(),
                        linkedTraderPubkey: traders[i].publicKey,
                        account: accounts[i],
                    });
                }
            }
            setInvestments(foundInvestments);
        } catch (err) {
            console.error("Failed to fetch investments", err);
            setInvestments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, [program, walletPubkey?.toBase58(), traders.length]);

    return { investments, loading, refetch: fetchInvestments };
}
