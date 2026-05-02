import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export type InvestmentLiveStats = {
    currentValue: number;
    pnl: number;
    pnlPercent: number;
};

export function useInvestmentLiveStats(investorWallet: PublicKey | null, investments: any[], traders: any[], solPrice: number) {
    const { connection } = useConnection();
    const [stats, setStats] = useState<Record<string, InvestmentLiveStats>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!connection || !investorWallet || investments.length === 0 || traders.length === 0 || !solPrice) {
            return;
        }

        const fetchLiveStats = async () => {
            if (document.hidden) return;
            
            try {
                setLoading(true);
                const newStats: Record<string, InvestmentLiveStats> = {};

                // Batch fetching would be better but for a few investments, sequential is fine
                for (const inv of investments) {
                    try {
                        const trader = traders.find(t => t.publicKey === inv.linkedTraderPubkey);
                        if (!trader) continue;

                        const [solBal, usdcBal, supplyInfo, shareBal] = await Promise.all([
                            connection.getTokenAccountBalance(new PublicKey(trader.account.traderVaultTokenSol)),
                            connection.getTokenAccountBalance(new PublicKey(trader.account.traderVaultTokenUsdc)),
                            connection.getTokenSupply(new PublicKey(trader.account.traderVaultSharesMint)),
                            connection.getTokenAccountBalance(getAssociatedTokenAddressSync(new PublicKey(trader.account.traderVaultSharesMint), investorWallet))
                        ]);

                        const vaultSol = Number(solBal.value.amount) / 1e9;
                        const vaultUsdc = Number(usdcBal.value.amount) / 1e6;
                        const totalShares = Number(supplyInfo.value.amount);
                        const myShares = Number(shareBal.value.amount);

                        const totalVaultValue = (vaultSol * solPrice) + vaultUsdc;
                        const myValue = totalShares > 0 ? (myShares / totalShares) * totalVaultValue : 0;
                        const initialValue = inv.account.initialDepositUsdValue.toNumber() / 1e6;
                        
                        const pnl = myValue - initialValue;
                        const pnlPercent = initialValue > 0 ? (pnl / initialValue) * 100 : 0;

                        newStats[inv.publicKey] = {
                            currentValue: myValue,
                            pnl,
                            pnlPercent
                        };
                    } catch (e) {
                        console.error("Failed to fetch stats for investment", inv.publicKey, e);
                    }
                }

                setStats(newStats);
            } catch (error) {
                console.error("Failed to fetch live investment stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveStats();
        const interval = setInterval(fetchLiveStats, 45000); // 45s to avoid 429s
        return () => clearInterval(interval);
    }, [connection, investorWallet?.toBase58(), investments.length, traders.length, solPrice]);

    return { stats, loading };
}
