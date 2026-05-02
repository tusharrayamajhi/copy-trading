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
    };
};

export function useTransactionHistory(wallet: PublicKey | null, isTrader: boolean = true) {
    const { connection } = useConnection();
    const program = useProgram();
    const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        if (!wallet || !connection || !program || document.hidden) return;
        
        try {
            setLoading(true);
            
            let targetAddress: PublicKey;
            if (isTrader) {
                const [pda] = getTraderAccountPDA(wallet);
                targetAddress = pda;
            } else {
                targetAddress = wallet;
            }
            
            const signatures = await connection.getSignaturesForAddress(targetAddress, {
                limit: 8 // Reduced limit to prevent 429s from too many getParsedTransaction calls
            });

            const detailedHistory: TransactionHistoryItem[] = (await Promise.all(
                signatures.map(async (sig) => {
                    try {
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
                                            details = {
                                                amount: args.amountIn.toNumber() / (args.targetAsset.usdc ? 1e6 : 1e9),
                                                asset: args.targetAsset.usdc ? "USDC" : "SOL",
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
                            details
                        } as TransactionHistoryItem;
                    } catch (e) {
                        return {
                            signature: sig.signature,
                            timestamp: sig.blockTime,
                            status: sig.err ? "failed" : "success",
                            slot: sig.slot,
                            action: "Unknown",
                        } as TransactionHistoryItem;
                    }
                })
            )).filter((item): item is TransactionHistoryItem => item !== null);

            setTransactions(detailedHistory);
        } catch (error) {
            console.error("Failed to fetch transaction history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 60000); // 60s
        return () => clearInterval(interval);
    }, [wallet, connection, program, isTrader]);

    return { transactions, loading, refetch: fetchHistory };
}
