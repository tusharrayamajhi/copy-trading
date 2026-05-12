import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";
import { getTraderAccountPDA } from "../lib/pdas";
import { useProgram } from "../lib/program";
import { PROGRAM_ID } from "../lib/constants";
import bs58 from "bs58";
import { Buffer } from "buffer";

export type TransactionHistoryItem = {
    signature: string;
    timestamp: number | null;
    status: "success" | "failed";
    slot: number;
    action: string;
    details?: {
        amount?: number;
        asset?: string;
        price?: number;
        from?: string;
        to?: string;
        toAsset?: string;
        vaultAddress?: string;
        pnlUsd?: number;
        pnlPercentage?: number;
    };
};

export function useTransactionHistory(wallet: PublicKey | null, isTrader: boolean = true, traderVaults: string[] = []) {
    const { connection } = useConnection();
    const program = useProgram();
    const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
    const [pnlHistory, setPnlHistory] = useState<{ time: number, value: number }[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        if (!wallet || !connection || !program || document.hidden) return;

        try {
            setLoading(true);

            const addressesToFetch: { pubkey: PublicKey, isVault: boolean }[] = [];
            
            if (isTrader) {
                const [pda] = getTraderAccountPDA(wallet);
                addressesToFetch.push({ pubkey: pda, isVault: true });
            } else {
                addressesToFetch.push({ pubkey: wallet, isVault: false });
                traderVaults.forEach(v => {
                    try { addressesToFetch.push({ pubkey: new PublicKey(v), isVault: true }); } catch (e) {}
                });
            }
            
            const allSignatures = await Promise.all(
                addressesToFetch.map(async ({ pubkey }) => {
                    try {
                        const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
                        return sigs.map(s => ({ ...s, targetAddress: pubkey }));
                    } catch (e) { return []; }
                })
            );

            const signatures = allSignatures
                .flat()
                .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
                .slice(0, 20);

            const detailedHistory: TransactionHistoryItem[] = (await Promise.all(
                signatures.map(async (sig) => {
                    try {
                        const currentTargetAddress = sig.targetAddress;
                        const tx = await connection.getParsedTransaction(sig.signature, {
                            maxSupportedTransactionVersion: 0,
                            commitment: "confirmed"
                        });

                        const isPlatformTx = tx?.transaction.message.instructions.some(
                            (i) => i.programId.equals(PROGRAM_ID)
                        );

                        if (!isPlatformTx && !isTrader) return null;

                        let action = "Interaction";
                        let details: any = {};

                        if (tx?.meta?.err) {
                            action = "Failed Transaction";
                        } else if (tx) {
                            const ix = tx.transaction.message.instructions.find(
                                (i) => i.programId.equals(PROGRAM_ID)
                            );

                            if (ix && 'data' in ix) {
                                try {
                                    const decoded = (program.coder.instruction as any).decode(Buffer.from(bs58.decode(ix.data)));
                                    if (decoded) {
                                        action = decoded.name.charAt(0).toUpperCase() + decoded.name.slice(1);

                                        if (decoded.name === "signalSwap") {
                                            const args = decoded.data as any;
                                            const isToUsdc = !!args.targetAsset.usdc;
                                            const fromAsset = isToUsdc ? "SOL" : "USDC";
                                            const decimals = fromAsset === "SOL" ? 1e9 : 1e6;

                                            details = {
                                                amount: args.amountIn.toNumber() / decimals,
                                                asset: fromAsset,
                                                toAsset: isToUsdc ? "USDC" : "SOL",
                                                price: args.price.toNumber() / 1e6,
                                            };
                                        } else if (decoded.name === "depositFunds") {
                                            const args = decoded.data as any;
                                            details = {
                                                amount: args.amount.toNumber() / 1e9,
                                                asset: "SOL",
                                                price: args.price.toNumber() / 1e6,
                                            };
                                        } else if (decoded.name === "withdrawFunds") {
                                            const args = decoded.data as any;
                                            details = {
                                                price: args.currentPrice.toNumber() / 1e6,
                                                asset: "SOL"
                                            };
                                        }
                                    }
                                } catch (e) {
                                    console.error("Failed to decode instruction", e);
                                }
                            }
                        }

                        return {
                            signature: sig.signature,
                            timestamp: sig.blockTime,
                            status: sig.err ? "failed" : "success",
                            slot: sig.slot,
                            action,
                            details: {
                                ...details,
                                vaultAddress: currentTargetAddress.toBase58()
                            }
                        } as TransactionHistoryItem;
                    } catch (e) {
                        return null;
                    }
                })
            )) as TransactionHistoryItem[];

            // Calculate On-Chain P&L and History Points
            let runningPnl = 0;
            let lastSwapPrice: number | null = null;
            const historyPoints: { time: number, value: number }[] = [];

            const sortedHistory = [...detailedHistory].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            for (const tx of sortedHistory) {
                if (tx.action === "SignalSwap" && tx.details?.price) {
                    const currentPrice = tx.details.price;
                    const isClosingPosition = tx.details.toAsset === "SOL";

                    if (isClosingPosition && lastSwapPrice) {
                        const pnlPercent = ((lastSwapPrice - currentPrice) / lastSwapPrice) * 100;
                        const amountUsd = tx.details.amount || 0;
                        const pnlUsd = (amountUsd * pnlPercent) / 100;

                        tx.details.pnlUsd = pnlUsd;
                        tx.details.pnlPercentage = pnlPercent;
                        runningPnl += pnlUsd;
                    }

                    lastSwapPrice = currentPrice;
                    if (tx.timestamp) {
                        historyPoints.push({ time: tx.timestamp, value: runningPnl });
                    }
                }
            }

            setPnlHistory(historyPoints);

            const syncPayloadAddress = isTrader 
                ? (getTraderAccountPDA(wallet)[0]).toBase58() 
                : wallet.toBase58();

            try {
                const syncRes = await fetch('/api/transactions/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactions: sortedHistory, wallet: syncPayloadAddress, isTrader })
                });

                if (syncRes.ok) {
                    const dbEnriched = await syncRes.json();
                    setTransactions(dbEnriched);
                    return;
                }
            } catch (e) {
                console.warn("Sync failed, falling back to on-chain calculation", e);
            }

            setTransactions(sortedHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        } catch (error) {
            console.error("Failed to fetch transaction history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [wallet?.toBase58(), JSON.stringify(traderVaults), connection, program, isTrader]);

    return { transactions, pnlHistory, loading, refetch: fetchHistory };
}
