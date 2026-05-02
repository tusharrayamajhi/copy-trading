"use client";
import { useTransactionHistory } from "../hooks/useTransactionHistory";
import { PublicKey } from "@solana/web3.js";
import { ExternalLink, CheckCircle2, XCircle, Clock, History, ArrowUpRight, ArrowRight, DollarSign, Coins, User, TrendingUp } from "lucide-react";

interface TransactionHistoryProps {
    wallet: PublicKey;
    isTrader?: boolean;
}

export function TransactionHistory({ wallet, isTrader = true }: TransactionHistoryProps) {
    const { transactions, loading } = useTransactionHistory(wallet, isTrader);

    const formatTime = (timestamp: number | null) => {
        if (!timestamp) return "Pending";
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(new Date(timestamp * 1000));
    };

    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return "";
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(new Date(timestamp * 1000));
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "SignalSwap": return <Coins className="w-4 h-4" />;
            case "DepositFunds": return <ArrowRight className="w-4 h-4" />;
            case "WithdrawFunds": return <User className="w-4 h-4" />;
            case "CreateTrader": return <TrendingUp className="w-4 h-4" />;
            default: return <History className="w-4 h-4" />;
        }
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                    <History className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Transaction History</h2>
                </div>
                <div className="flex justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <History className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Platform Activity</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                            {isTrader ? "Trader Execution Logs" : "Investor Activity Logs"}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => window.open(`https://explorer.solana.com/address/${wallet.toBase58()}?cluster=devnet`, '_blank')}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-950 px-4 py-2 rounded-xl border border-slate-800"
                >
                    EXPLORER <ExternalLink className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                        <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No recent platform transactions found.</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div 
                            key={tx.signature}
                            className="group flex flex-col p-5 bg-slate-950/50 border border-slate-800/50 rounded-2xl hover:bg-slate-800/20 hover:border-slate-700/50 transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        tx.status === "success" ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-500"
                                    }`}>
                                        {getActionIcon(tx.action)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{tx.action}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-medium">{formatDate(tx.timestamp)} • {formatTime(tx.timestamp)}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 font-mono">
                                                {tx.signature.slice(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {tx.status === "failed" && (
                                        <span className="text-[10px] font-bold text-red-400 uppercase bg-red-400/10 px-2 py-1 rounded-lg">Failed</span>
                                    )}
                                    <a 
                                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 text-slate-400 hover:text-white"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            {/* Detailed Info */}
                            {tx.details && Object.keys(tx.details).length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/50 mt-1">
                                    {tx.details.amount && (
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Amount</p>
                                            <p className="text-xs font-bold text-slate-200">
                                                {tx.details.amount.toLocaleString()} <span className="text-[10px] text-cyan-500">{tx.details.asset}</span>
                                            </p>
                                        </div>
                                    )}
                                    {tx.details.price && (
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Oracle Price</p>
                                            <p className="text-xs font-bold text-slate-200">${tx.details.price.toFixed(2)}</p>
                                        </div>
                                    )}
                                    {tx.details.amount && tx.details.price && (
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Value (USD)</p>
                                            <p className="text-xs font-bold text-green-400">${(tx.details.amount * tx.details.price).toFixed(2)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Status</p>
                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} /> {tx.status === 'success' ? 'Confirmed' : 'Error'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {transactions.length > 0 && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                    <p className="text-[10px] text-slate-600 italic">Showing recent platform interactions for this wallet</p>
                </div>
            )}
        </div>
    );
}
