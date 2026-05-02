"use client";

import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, use } from "react";
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
    Target
} from "lucide-react";
import { TransactionHistory } from "../../../src/components/TransactionHistory";
import { BankStatus } from "../../../src/components/BankStatus";
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

          toast.loading("Processing deposit...", { id: "deposit" });
          await deposit(traderPubkey, lamports);
          toast.success("Deposit successful!", { id: "deposit" });
          refetch();
        } catch (err: any) {
          toast.error(err.message || "Deposit failed", { id: "deposit" });
        } finally {
          setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-950">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!traderAccount) {
        return (
            <div className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold mb-4">Trader Not Found</h2>
                <button onClick={() => router.back()} className="text-cyan-400 flex items-center gap-2 mx-auto">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const profit = (traderAccount.lifetimeProfitUsd.toNumber() - traderAccount.lifetimeLossUsd.toNumber()) / 1e6;
    const currentAsset = Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header / Nav */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2 text-slate-400 hover:text-white group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">BACK TO DISCOVERY</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-500">
                            ID: {address.slice(0, 8)}...{address.slice(-8)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Profile Hero */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                                    <Users className="text-white w-10 h-10" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <h1 className="text-4xl font-black italic tracking-tighter">SIGNAL PROVIDER</h1>
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Verified</span>
                                    </div>
                                    <p className="text-slate-400 font-mono text-sm break-all mb-8 bg-slate-950/50 p-3 rounded-xl border border-slate-800 inline-block">
                                        {address}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lifetime P&L</p>
                                            <p className={`text-2xl font-black ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                {profit >= 0 ? "+" : ""}${Math.abs(profit).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Trades</p>
                                            <p className="text-2xl font-black text-white">{traderAccount.totalTrades.toString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Commission</p>
                                            <p className="text-2xl font-black text-cyan-400">{traderAccount.commissionPercentage / 100}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Asset</p>
                                            <p className="text-2xl font-black text-blue-400 uppercase">{currentAsset}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart / Strategy Section */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-xl">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <BarChart3 className="w-6 h-6 text-cyan-400" /> Market Analysis
                                </h2>
                                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Oracle SOL/USD:</span>
                                    <span className="text-sm font-bold text-cyan-400">${manualPrice}</span>
                                </div>
                            </div>
                            
                            <div className="w-full h-[400px] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-inner mb-8">
                                <iframe 
                                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=BINANCE%3A${currentAsset === "SOL" ? "SOLUSDT" : "USDCUSDT"}&interval=D&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ASOLUSDT`}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4 text-cyan-400">
                                        <Target className="w-5 h-5" />
                                        <h4 className="font-bold">Strategy Goal</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        This provider focuses on {currentAsset === 'SOL' ? 'aggressive SOL growth' : 'capital protection in USDC'}. 
                                        They maintain high liquidity and react quickly to market volatility.
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4 text-purple-400">
                                        <Shield className="w-5 h-5" />
                                        <h4 className="font-bold">Risk Level</h4>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Moderate. The vault utilizes a Bank-based internal DEX to swap assets at real-time Oracle prices, reducing slippage risk.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <TransactionHistory wallet={traderPubkey} isTrader={true} />
                    </div>

                    {/* Sidebar / Investment Panel */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[2.5rem] p-8 shadow-2xl shadow-cyan-500/10">
                            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">Invest & Follow</h3>
                            <p className="text-cyan-100/70 text-sm mb-8 leading-relaxed">
                                Join this trader's vault. Your capital will automatically mirror their strategy changes.
                            </p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-cyan-200 uppercase tracking-widest mb-2">Deposit Amount (SOL)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300" />
                                        <input 
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-bold"
                                            placeholder="0.1"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleDeposit}
                                    disabled={submitting}
                                    className="w-full bg-white text-blue-700 font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                                >
                                    {submitting ? "Processing..." : <>Confirm Deposit <ArrowUpRight className="w-5 h-5" /></>}
                                </button>
                                
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] text-cyan-100 leading-tight">
                                    <strong>Note:</strong> Depositing will issue Vault Shares to your wallet. You can withdraw at any time for your principal plus any accrued profits.
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><Vault className="w-5 h-5 text-cyan-400" /> Vault Security</h4>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                                        Capital is stored in a Program Derived Address (PDA) accessible only through the platform's smart contract.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                                        No lock-up period. Withdraw your funds instantly whenever the trader is not mid-execution.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <BankStatus />
                    </div>

                </div>
            </div>
        </div>
    );
}
