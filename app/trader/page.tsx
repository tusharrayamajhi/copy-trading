"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { useTraderAccount, usePlatformConfig } from "../../src/hooks/useTraderQueries";
import { useCreateTrader } from "../../src/hooks/useCreateTrader";
import { useSignalSwap } from "../../src/hooks/useSignalSwap";
import { useInitializePlatform } from "../../src/hooks/useInitializePlatform";
import { 
    Activity, Copy, CheckCircle2, AlertCircle, DollarSign, 
    ArrowLeftRight, TrendingUp, TrendingDown, Users, Vault,
    Info, ShoppingCart, Tag, RefreshCw, BarChart3, Zap, ArrowRight,
    TrendingUp as Bullish, TrendingDown as Bearish
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { TransactionHistory } from "../../src/components/TransactionHistory";

export default function TraderDashboard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [vaultBalances, setVaultBalances] = useState<{ sol: number, usdc: number }>({ sol: 0, usdc: 0 });
  const { data: traderAccount, loading, refetch } = useTraderAccount(publicKey);
  const { data: platformConfig, loading: loadingConfig, refetch: refetchConfig } = usePlatformConfig();

  const createTrader = useCreateTrader();
  const signalSwap = useSignalSwap();
  const initializePlatform = useInitializePlatform();

  const [submitting, setSubmitting] = useState(false);
  const [commission, setCommission] = useState(10); // 10%
  const [manualPrice, setManualPrice] = useState<string>("");

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { getSolPrice } = await import("../../src/lib/price");
        const price = await getSolPrice();
        setManualPrice(price.toFixed(2));
      } catch (e) {
        console.error("Price fetch failed in dashboard");
        setManualPrice("145.00");
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setWalletBalance(bal / 1e9);
    } catch (e) {
      console.error("Failed to fetch wallet balance");
    }
  }, [publicKey, connection]);

  const fetchVaultBalances = useCallback(async () => {
    if (!traderAccount || !connection) return;
    try {
      const solBal = await connection.getTokenAccountBalance(traderAccount.traderVaultTokenSol);
      const usdcBal = await connection.getTokenAccountBalance(traderAccount.traderVaultTokenUsdc);

      setVaultBalances({
        sol: Number(solBal.value.amount) / 1e9,
        usdc: Number(usdcBal.value.amount) / 1e6
      });
    } catch (e: any) {
      console.error("Failed to fetch vault balances:", e);
      if (e.message?.includes("could not find account")) {
        setVaultBalances({ sol: 0, usdc: 0 });
      }
    }
  }, [traderAccount, connection]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  useEffect(() => {
    fetchVaultBalances();
    const interval = setInterval(fetchVaultBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchVaultBalances]);

  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-slate-400 font-mono">Sign in to manage your trading signal and followers.</p>
      </div>
    );
  }

  const handleCreateProfile = async () => {
    try {
      setSubmitting(true);
      await createTrader(commission * 100);
      toast.success("Trader profile created successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async (asset: "Sol" | "Usdc") => {
    try {
      setSubmitting(true);
      await signalSwap(asset);
      toast.success(`Strategy shifted to ${asset} successfully!`);
      refetch();
      fetchVaultBalances();
    } catch (err: any) {
      toast.error(err.message || "Execution failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingConfig) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" /></div>;
  }

  if (!platformConfig) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Platform not initialized</h2>
        <button onClick={() => initializePlatform()} className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl">Init Platform</button>
      </div>
    );
  }

  if (!traderAccount) {
    return (
        <div className="container mx-auto px-6 py-12 max-w-2xl">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <h1 className="text-3xl font-bold mb-8">Setup Trader Profile</h1>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Commission (%)</label>
                        <input
                            type="number"
                            value={commission}
                            onChange={(e) => setCommission(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                        />
                    </div>
                    <button onClick={handleCreateProfile} disabled={submitting} className="w-full bg-cyan-500 py-4 rounded-xl font-bold text-slate-950">Initialize Vault</button>
                </div>
            </div>
        </div>
    );
  }

  const currentAsset = Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";
  const realizedProfit = traderAccount.lifetimeProfitUsd.toNumber() / 1e6;
  const realizedLoss = traderAccount.lifetimeLossUsd.toNumber() / 1e6;
  const netRealized = realizedProfit - realizedLoss;

  const livePrice = Number(manualPrice) || 0;
  const liveVaultValueUsd = (vaultBalances.sol * livePrice) + vaultBalances.usdc;
  const initialVaultValueUsd = traderAccount.totalSharesValueUsd.toNumber() / 1e6;
  const unrealizedPnl = initialVaultValueUsd > 0.01 ? (liveVaultValueUsd - initialVaultValueUsd) : 0;
  const pnlPercent = initialVaultValueUsd > 0.01 ? (unrealizedPnl / initialVaultValueUsd) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <BarChart3 className="text-white w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">TRADING COMMAND</h1>
          </div>
          <p className="text-slate-500 font-mono text-xs flex items-center gap-2">
            WALLET: {publicKey.toBase58().slice(0, 8)}...
          </p>
        </div>

        <div className="flex gap-4">
            <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Live Price</p>
                    <p className="text-xl font-black text-cyan-400">${manualPrice || "..."}</p>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Wallet</p>
                    <p className="text-xl font-black text-white">{walletBalance?.toFixed(3) || "0.000"} SOL</p>
                </div>
            </div>
            <button 
                onClick={() => { refetch(); fetchVaultBalances(); }}
                className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all"
            >
                <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- MAIN STRATEGY AREA --- */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] pointer-events-none"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-xl font-black italic text-white flex items-center gap-3">
                        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> 
                        INSTANT SWAP
                    </h2>
                    <div className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-2 ${
                        currentAsset === "SOL" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {currentAsset} MODE
                    </div>
                </div>

                <div className="w-full h-[400px] bg-slate-950 rounded-[2rem] border-2 border-slate-800 overflow-hidden mb-8 shadow-2xl relative group">
                    <div className="absolute inset-0 border-2 border-cyan-500/10 group-hover:border-cyan-500/20 transition-colors pointer-events-none z-20 rounded-[2rem]"></div>
                    <iframe
                        src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE%3ASOLUSDT&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&locale=en`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* BUY SOL BUTTON */}
                    <button
                        onClick={() => handleSwap("Sol")}
                        disabled={submitting || currentAsset === "SOL"}
                        className={`group relative p-0.5 rounded-2xl transition-all duration-500 ${
                            currentAsset === "SOL" 
                            ? "opacity-40 cursor-not-allowed" 
                            : "hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-green-500`}></div>
                        <div className={`relative h-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all duration-500 bg-slate-950 ${
                            currentAsset === "SOL" 
                            ? "border-slate-800 text-slate-600" 
                            : "border-green-500/20 group-hover:border-green-500"
                        }`}>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-white mb-0.5 flex items-center gap-2">
                                    BUY SOL <Bullish className="w-4 h-4 text-green-500" />
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entry Strategy</p>
                            </div>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                currentAsset === "SOL" ? "bg-slate-800" : "bg-green-500 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40"
                            }`}>
                                <ShoppingCart className={`w-5 h-5 ${currentAsset === "SOL" ? "text-slate-600" : "text-slate-950"}`} />
                            </div>
                        </div>
                    </button>

                    {/* SELL SOL BUTTON */}
                    <button
                        onClick={() => handleSwap("Usdc")}
                        disabled={submitting || currentAsset === "USDC"}
                        className={`group relative p-0.5 rounded-2xl transition-all duration-500 ${
                            currentAsset === "USDC" 
                            ? "opacity-40 cursor-not-allowed" 
                            : "hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-rose-500`}></div>
                        <div className={`relative h-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all duration-500 bg-slate-950 ${
                            currentAsset === "USDC" 
                            ? "border-slate-800 text-slate-600" 
                            : "border-rose-500/20 group-hover:border-rose-500"
                        }`}>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-white mb-0.5 flex items-center gap-2">
                                    SELL SOL <Bearish className="w-4 h-4 text-rose-500" />
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Exit Strategy</p>
                            </div>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                currentAsset === "USDC" ? "bg-slate-800" : "bg-rose-500 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/40"
                            }`}>
                                <Tag className={`w-5 h-5 ${currentAsset === "USDC" ? "text-slate-600" : "text-white"}`} />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Bullish className="w-32 h-32 text-green-400" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Unrealized Strategy P&L</p>
                            <div className={`text-5xl font-black tabular-nums tracking-tighter ${unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl text-xs font-black ${unrealizedPnl >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {pnlPercent.toFixed(2)}%
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3 relative z-10">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-tighter">Current Value</span>
                            <span className="text-white font-black">${liveVaultValueUsd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-tighter">Principal Basis</span>
                            <span className="text-slate-400 font-bold">${initialVaultValueUsd.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <DollarSign className="w-32 h-32 text-cyan-400" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Lifetime Realized Performance</p>
                    <div className={`text-5xl font-black mb-6 tabular-nums tracking-tighter ${netRealized >= 0 ? "text-cyan-400" : "text-red-400"}`}>
                        {netRealized >= 0 ? "+" : ""}${netRealized.toFixed(2)}
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <div className="flex-1 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                            <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mb-1">Total Profits</p>
                            <p className="text-lg font-black text-white">${realizedProfit.toFixed(2)}</p>
                        </div>
                        <div className="flex-1 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                            <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mb-1">Total Losses</p>
                            <p className="text-lg font-black text-white">${realizedLoss.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SIDEBAR --- */}
        <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] pointer-events-none"></div>
                <h3 className="text-lg font-black text-white italic mb-8 flex items-center gap-3">
                    <Vault className="w-5 h-5 text-cyan-400" /> VAULT ANALYTICS
                </h3>
                
                <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Management Fee</span>
                        <span className="text-sm font-black text-white tabular-nums">{traderAccount.commissionPercentage / 100}%</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">SOL Liquidity</span>
                        <span className="text-sm font-black text-white tabular-nums">{vaultBalances.sol.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">USDC Liquidity</span>
                        <span className="text-sm font-black text-white tabular-nums">${vaultBalances.usdc.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-500"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">PnL Methodology</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold relative z-10">
                        Live PnL = (SOL Balance × Market Price + USDC Balance) - Principal Basis.<br/><br/>
                        The Principal Basis represents the absolute USD cost of all funds active in the vault. 
                    </p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                <h3 className="text-sm font-black text-white mb-4 italic uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" /> STRATEGY ENGINE
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                    Every swap execution is logged on-chain. Current Oracle input is derived from live Binance price feeds via the platform gateway.
                </p>
                <div className="space-y-3">
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Vault SOL Address</p>
                        <p className="text-[9px] font-mono text-slate-500 truncate">{traderAccount.traderVaultTokenSol?.toBase58()}</p>
                    </div>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Vault USDC Address</p>
                        <p className="text-[9px] font-mono text-slate-500 truncate">{traderAccount.traderVaultTokenUsdc?.toBase58()}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-20">
        <TransactionHistory wallet={publicKey} />
      </div>
    </div>
  );
}
