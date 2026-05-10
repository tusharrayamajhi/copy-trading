// src/hooks/useTraderQueries.ts
import { useEffect, useState } from "react";
import { useProgram } from "../lib/program";
import { PublicKey } from "@solana/web3.js";
import { getTraderAccountPDA, getPlatformConfigPDA } from "../lib/pdas";

export type TraderInfo = {
    publicKey: string;
    account: any;
};

export function useAllTraders() {
    const program = useProgram();
    const [traders, setTraders] = useState<TraderInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = async () => {
        if (!program) return;
        try {
            setLoading(true);
            
            // 1. Implementation of the robust fetch pattern
            const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
                for (let i = 0; i < retries; i++) {
                    try {
                        return await fn();
                    } catch (err: any) {
                        if (err.message?.includes("429") || err.logs?.some((l: string) => l.includes("429"))) {
                            const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                            console.warn(`Rate limit hit, retrying in ${delay.toFixed(0)}ms...`);
                            await new Promise(res => setTimeout(res, delay));
                            continue;
                        }
                        throw err;
                    }
                }
            };

            const accounts = await fetchWithRetry(() => (program.account as any).traderAccount.all());
            
            // Fetch DB Profiles
            let profileMap: Record<string, any> = {};
            try {
                const profileRes = await fetch("/api/traders/profiles");
                if (profileRes.ok) {
                    profileMap = await profileRes.json();
                }
            } catch (e) {
                console.error("Failed to fetch profiles map", e);
            }

            const formattedTraders = accounts
                .filter((a: any) => a && a.publicKey && a.account)
                .map((a: any) => {
                    const wallet = a.account.traderWallet.toBase58();
                    return {
                        publicKey: a.publicKey.toBase58(),
                        account: {
                            ...a.account,
                            ...(profileMap[wallet] || {})
                        },
                    };
                });
            
            setTraders(formattedTraders);
        } catch (err) {
            console.error("Failed to fetch traders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [program]);

    return { traders, loading, refetch };
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
            console.log("Fetching TraderAccount for wallet:", traderWallet.toBase58());
            console.log("PDA:", pda.toBase58());
            
            if (!program.account) {
                throw new Error("program.account is not initialized");
            }

            const traderAccountProxy = (program.account as any).traderAccount;
            if (!traderAccountProxy) {
                throw new Error("traderAccount proxy not found on program.account");
            }

            // Using fetch instead of fetchNullable to see if it gives a better error
            const accountData = await traderAccountProxy.fetch(pda).catch((e: any) => {
                if (e.message?.includes("Account does not exist")) return null;
                throw e;
            });
            
            // Fetch Off-chain Profile
            let dbProfile = {};
            try {
                const profileRes = await fetch(`/api/trader/public-profile?address=${traderWallet.toBase58()}`);
                if (profileRes.ok) {
                    dbProfile = await profileRes.json();
                }
            } catch (e) {
                console.error("Failed to fetch DB profile", e);
            }

            setData(accountData ? { ...accountData, ...dbProfile } : null);
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

export function usePlatformConfig() {
    const program = useProgram();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const refetch = async () => {
        if (!program) return;
        try {
            setLoading(true);
            const [pda] = getPlatformConfigPDA();

            const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
                for (let i = 0; i < retries; i++) {
                    try {
                        return await fn();
                    } catch (err: any) {
                        if (err.message?.includes("429")) {
                            await new Promise(res => setTimeout(res, 1000 * (i + 1)));
                            continue;
                        }
                        throw err;
                    }
                }
            };

            const config = await fetchWithRetry(() => (program.account as any).platformConfig.fetchNullable(pda));
            setData(config);
        } catch (error) {
            console.error("Failed to fetch platform config:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [program]);

    return { data, loading, refetch };
}
