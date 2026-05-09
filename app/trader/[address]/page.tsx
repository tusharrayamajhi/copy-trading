"use client";

import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useTraderAccount } from "../../../src/hooks/useTraderQueries";
import { PublicKey } from "@solana/web3.js";
import {
    ArrowLeft,
    Activity,
    BarChart3,
    Shield,
    TrendingUp,
    Users,
    ArrowUpRight,
    DollarSign,
    Vault,
    Clock,
    Target,
    Zap,
    History,
    ChevronRight,
    AlertCircle,
    Info,
    RefreshCw
} from "lucide-react";
import { TransactionHistory } from "../../../src/components/TransactionHistory";
import toast from "react-hot-toast";
import { useDeposit } from "../../../src/hooks/useDeposit";
import { useWrapSol } from "../../../src/hooks/useWrapSol";

export default function TraderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const address = params.address as string;
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const traderPubkey = new PublicKey(address);
    const { data: traderAccount, loading, refetch } = useTraderAccount(traderPubkey);

    const deposit = useDeposit();
    const { wrap } = useWrapSol();

    const [amount, setAmount] = useState<string>("0.1");
    const [submitting, setSubmitting] = useState(false);
    const [manualPrice, setManualPrice] = useState<string>("...");

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const { getSolPrice } = await import("../../../src/lib/price");
                const price = await getSolPrice();
                setManualPrice(price.toFixed(2));
            } catch (e) {
                setManualPrice("145.00");
            }
        };
        fetchPrice();
    }, []);

    const handleDeposit = async () => {
        if (!publicKey) {
            toast.error("Please connect your wallet first");
            return;
        }
        try {
            setSubmitting(true);
            const requestedAmount = Number(amount);
            const lamports = BigInt(Math.floor(requestedAmount * 1e9));

            toast.loading("Preparing funds (Wrapping SOL)...", { id: "deposit" });

            try {
                await wrap(requestedAmount);
            } catch (wrapErr: any) {
                console.error("Wrapping failed:", wrapErr);
                throw new Error("Failed to wrap SOL. Please ensure you have enough balance.");
            }

            toast.loading("Processing deposit...", { id: "deposit" });
            const price = Number(manualPrice);
            if (isNaN(price) || price <= 0) throw new Error("Invalid SOL price");
            
            await deposit(traderPubkey, lamports, price);
            toast.success("Deposit successful!", { id: "deposit" });
            refetch();
        } catch (err: any) {
            console.error("Deposit Error:", err);
            toast.error(err.message || "Deposit failed", { id: "deposit" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-950">
                <div className="animate-spin w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!traderAccount) {
        return (
            <div className="container mx-auto px-6 py-20 text-center bg-slate-950 min-h-screen">
                <h2 className="text-3xl font-black italic tracking-tighter mb-4 text-white">TRADER NOT FOUND</h2>
                <button onClick={() => router.back()} className="text-cyan-400 font-black flex items-center gap-2 mx-auto uppercase text-sm">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const profit = (traderAccount.lifetimeProfitUsd.toNumber() - traderAccount.lifetimeLossUsd.toNumber()) / 1e6;
    const currentAsset = Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";
    const pnlColor = profit > 0.01 ? "text-green-400" : profit < -0.01 ? "text-red-400" : "text-slate-400";

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header / Nav */}
            <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-2xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
                    <button onClick={() => router.back()} className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl transition-all flex items-center gap-2 text-slate-400 hover:text-white group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black text-[10px] uppercase tracking-widest">DISCOVERY</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] font-black italic text-slate-500 tracking-tighter uppercase">
                            TRADER PROFILE GATEWAY
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Profile Hero */}
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full -ml-40 -mb-40 pointer-events-none" />

                            <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                                <div className="w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-500/30 ring-4 ring-slate-900">
                                    <Users className="text-slate-950 w-12 h-12" />
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">SIGNAL PROVIDER</h1>
                                        <div className="px-4 py-1.5 bg-green-500/10 text-green-400 border-2 border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            VERIFIED
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-slate-400 font-mono text-xs break-all bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
                                            {address}
                                        </p>
                                        <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Copy Address">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Lifetime P&L</p>
                                            <p className={`text-2xl font-black tabular-nums ${pnlColor}`}>
                                                {profit > 0.01 ? "+" : ""}${Math.abs(profit).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Executions</p>
                                            <p className="text-2xl font-black text-white tabular-nums">{traderAccount.totalTrades.toString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Perf. Fee</p>
                                            <p className="text-2xl font-black text-cyan-400 tabular-nums">{traderAccount.commissionPercentage / 100}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Asset</p>
                                            <p className={`text-2xl font-black uppercase ${currentAsset === 'SOL' ? 'text-blue-400' : 'text-purple-400'}`}>{currentAsset}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart / Strategy Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black italic text-white flex items-center gap-3">
                                    <BarChart3 className="w-6 h-6 text-cyan-400" /> MARKET DYNAMICS
                                </h2>
                                <div className="flex gap-4">
                                    <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LIVE ORACLE</span>
                                        <span className="text-sm font-black text-cyan-400">${manualPrice}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-[450px] bg-slate-950 rounded-[2rem] border-2 border-slate-800 overflow-hidden shadow-inner mb-10 relative group">
                                <div className="absolute inset-0 border-2 border-cyan-500/10 group-hover:border-cyan-500/20 transition-colors pointer-events-none z-20 rounded-[2rem]"></div>
                                <iframe
                                    src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE%3A${currentAsset === "SOL" ? "SOLUSDT" : "USDCUSDT"}&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&locale=en`}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                        <Target className="w-24 h-24 text-cyan-400" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 text-cyan-400 relative z-10">
                                        <Target className="w-5 h-5" />
                                        <h4 className="font-black italic uppercase tracking-widest text-sm">STRATEGY FOCUS</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium relative z-10">
                                        This provider is currently positioned in **{currentAsset}**. 
                                        {currentAsset === 'SOL' 
                                            ? ' Seeking maximum exposure to Solana price appreciation with high-frequency updates.' 
                                            : ' Prioritizing capital preservation in stablecoins during volatile market conditions.'}
                                    </p>
                                </div>
                                <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                        <Shield className="w-24 h-24 text-purple-400" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 text-purple-400 relative z-10">
                                        <Shield className="w-5 h-5" />
                                        <h4 className="font-black italic uppercase tracking-widest text-sm">SECURITY PROFILE</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium relative z-10">
                                        The vault employs a non-custodial PDA architecture. Trader signals are executed via on-chain platform liquidity, ensuring zero-slippage entry and exit based on real-time Oracle inputs.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="mt-12">
                            <TransactionHistory wallet={traderPubkey} isTrader={true} />
                        </div>
                    </div>

                    {/* Sidebar / Investment Panel */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-cyan-500/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
                            
                            <h3 className="text-3xl font-black text-white italic mb-4 flex items-center gap-3 uppercase tracking-tighter">
                                <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" /> DEPLOY CAPITAL
                            </h3>
                            <p className="text-slate-400 text-xs mb-10 leading-relaxed font-medium">
                                Deposit SOL to mirror this trader's strategy instantly. All funds are secured by the platform's non-custodial smart contract.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Entry Amount (SOL)</label>
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Min: 0.1 SOL</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-focus-within:opacity-40 transition-opacity"></div>
                                        <div className="relative bg-slate-950 border-2 border-slate-800 group-focus-within:border-cyan-500 rounded-2xl flex items-center px-5 transition-all">
                                            <DollarSign className="w-5 h-5 text-cyan-500" />
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-transparent py-5 pl-3 pr-2 text-white placeholder-slate-600 focus:outline-none font-black text-xl tabular-nums"
                                                placeholder="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDeposit}
                                    disabled={submitting}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-6 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                                >
                                    {submitting ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>INITIALIZE DEPOSIT <ArrowUpRight className="w-5 h-5" /></>
                                    )}
                                </button>

                                <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl flex gap-4 items-start">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                                        Your capital is locked in a vault-specific PDA. You will receive shares representing your ownership. Reclaim at any time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <h4 className="text-lg font-black text-white italic mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <Shield className="w-5 h-5 text-purple-400" /> TRUST & SAFETY
                            </h4>
                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:border-purple-500/30 transition-colors">
                                        <Shield className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Vault Security</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                            Funds are managed via Program Derived Addresses, ensuring only you can reclaim your capital.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:border-purple-500/30 transition-colors">
                                        <Clock className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Instant Redemptions</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                            No arbitrary lock-ups. Withdraw shares for underlying SOL/USDC based on live performance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

function Copy({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
    )
}
