"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useTraderAccount, usePlatformConfig } from "../../src/hooks/useTraderQueries";
import { useCreateTrader } from "../../src/hooks/useCreateTrader";
import { useSignalSwap } from "../../src/hooks/useSignalSwap";
import { useInitializePlatform } from "../../src/hooks/useInitializePlatform";
import { Activity, Copy, CheckCircle2, AlertCircle, DollarSign, ArrowLeftRight, TrendingUp, TrendingDown, Users, Vault } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { BankStatus } from "../../src/components/BankStatus";

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
            setManualPrice("145.00"); // Force a default if everything crashes
        }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!publicKey || !connection) return;
    const fetchBalance = async () => {
        const bal = await connection.getBalance(publicKey);
        setWalletBalance(bal / 1e9);
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  useEffect(() => {
    if (!traderAccount || !connection) return;
    const fetchVaultBalances = async () => {
        try {
            const solBal = await connection.getTokenAccountBalance(traderAccount.traderVaultTokenSol);
            const usdcBal = await connection.getTokenAccountBalance(traderAccount.traderVaultTokenUsdc);
            setVaultBalances({
                sol: Number(solBal.value.amount) / 1e9,
                usdc: Number(usdcBal.value.amount) / 1e6
            });
        } catch (e) {
            console.error("Failed to fetch vault balances");
        }
    };
    fetchVaultBalances();
    const interval = setInterval(fetchVaultBalances, 10000);
    return () => clearInterval(interval);
  }, [traderAccount, connection]);

  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Connect your wallet to access the Trader Dashboard</h2>
      </div>
    );
  }

  const handleCreateProfile = async () => {
    try {
      setSubmitting(true);
      const bps = commission * 100;
      await createTrader(bps);
      toast.success("Trader profile created successfully!");
      refetch();
    } catch (err: any) {
      console.error("Create Trader Error:", err);
      const logs = err.logs || (typeof err.getLogs === 'function' ? err.getLogs() : null);
      if (logs) {
        console.log("Transaction Logs:", logs);
      }
      if (err.message?.includes("already in use") || (logs && logs.some((l: string) => l.includes("already in use")))) {
        toast.error("Profile already exists! Try refreshing the page.");
        refetch(); // Attempt to load the existing profile
      } else {
        toast.error(err.message || "Failed to create profile");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async (asset: "Sol" | "Usdc") => {
    try {
      setSubmitting(true);
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Invalid price. Please enter a price manually.");
      
      const tx = await signalSwap(asset, price);
      toast.success(`Strategy shifted to ${asset} at $${price.toFixed(2)}!`);
      refetch();
    } catch (err: any) {
      console.error("Swap Error:", err);
      toast.error(err.message || "Swap failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitializePlatform = async () => {
    try {
        setSubmitting(true);
        toast.loading("Initializing platform...", { id: "init-platform" });
        await initializePlatform();
        toast.success("Platform initialized successfully!", { id: "init-platform" });
        refetchConfig();
    } catch (err: any) {
        toast.error(err.message || "Initialization failed", { id: "init-platform" });
    } finally {
        setSubmitting(false);
    }
  };

  if (loading || loadingConfig) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" /></div>;
  }

  // Phase 1: Onboarding
  if (!platformConfig) {
    return (
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Platform Not Initialized</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
                The program is deployed but the platform configuration has not been set up. 
                If you are the admin, click below to initialize the system.
            </p>
            <button 
                onClick={handleInitializePlatform}
                disabled={submitting}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
                {submitting ? "Initializing..." : "Initialize Platform (Admin Only)"}
            </button>
        </div>
      </div>
    );
  }

  if (!traderAccount) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
            <Activity className="text-cyan-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Initialize your Trader Profile</h1>
          <p className="text-slate-400 mb-8">Set your commission and start managing strategy for your followers.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Commission Percentage (%)</label>
              <input 
                type="number" 
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                min="0"
                max="100"
              />
              <p className="text-xs text-slate-500 mt-2">This is the percentage of profit you earn when an investor withdraws.</p>
            </div>

            <button 
              onClick={handleCreateProfile}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Initialize Profile & Vault"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAsset = Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";
  const profit = traderAccount.lifetimeProfitUsd.toNumber() / 10**6;
  const loss = traderAccount.lifetimeLossUsd.toNumber() / 10**6;
  const net = profit - loss;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
        <div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent italic tracking-tighter">TRADER DASHBOARD</h1>
            <p className="text-slate-400 font-mono text-sm">{publicKey.toBase58()}</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Wallet Balance</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xl font-black text-white">{walletBalance?.toFixed(3) || "0.000"} <span className="text-slate-500 text-sm italic">SOL</span></p>
                </div>
            </div>
            <button onClick={() => refetch()} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all self-center">
                <Activity className="w-5 h-5 text-slate-400" />
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strategy Control */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-cyan-400" /> Strategy Management</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Price</span>
                    <input 
                        type="number" 
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        className="bg-transparent border-none text-cyan-400 font-bold w-20 focus:outline-none text-sm"
                        placeholder="Loading..."
                    />
                </div>
                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                  Current Asset: {currentAsset}
                </div>
              </div>
            </div>

            {/* TradingView Chart Embed */}
            <div className="w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden mb-8 shadow-inner">
                <iframe 
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d4d&symbol=BINANCE%3A${currentAsset === "SOL" ? "SOLUSDT" : "USDCUSDT"}&interval=D&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ASOLUSDT`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => handleSwap("Sol")}
                disabled={submitting || currentAsset === "SOL"}
                className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${currentAsset === "SOL" ? "border-cyan-500 bg-cyan-500/5 shadow-lg shadow-cyan-500/10" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentAsset === "SOL" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">Shift to SOL</h3>
                  <p className="text-sm text-slate-500">Target price growth of Solana</p>
                </div>
              </button>

              <button 
                onClick={() => handleSwap("Usdc")}
                disabled={submitting || currentAsset === "USDC"}
                className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${currentAsset === "USDC" ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentAsset === "USDC" ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">Shift to USDC</h3>
                  <p className="text-sm text-slate-500">Protect capital in stablecoins</p>
                </div>
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm text-slate-400 italic">Executing a swap will move all liquidity from your Vault into the Bank to acquire the target asset at real-time market prices.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-slate-400 text-sm font-medium mb-1">Lifetime Performance</h3>
                <div className={`text-3xl font-black mb-4 ${net >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {net >= 0 ? "+" : ""}${net.toFixed(2)}
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase">Profits</p>
                        <p className="text-lg font-bold text-green-400/80">${profit.toFixed(2)}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase">Losses</p>
                        <p className="text-lg font-bold text-red-400/80">${loss.toFixed(2)}</p>
                    </div>
                </div>
             </div>

             <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-slate-400 text-sm font-medium mb-1">Vault Utilization</h3>
                <div className="text-3xl font-black mb-4 text-slate-100">
                    {traderAccount.totalTrades.toString()} <span className="text-sm font-normal text-slate-500">trades</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Verified On-chain
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
            <BankStatus />
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Vault className="w-5 h-5 text-cyan-400" /> Vault Configuration</h3>
                
                <div className="space-y-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-500 uppercase mb-1">Commission Rate</p>
                        <p className="text-lg font-bold text-slate-200">{traderAccount.commissionPercentage / 100}%</p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-500 uppercase mb-1">Vault Liquidity</p>
                        <p className="text-lg font-bold text-slate-200">
                            {currentAsset === "SOL" 
                                ? `${vaultBalances.sol.toFixed(3)} SOL` 
                                : `$${vaultBalances.usdc.toFixed(2)} USDC`}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-500 uppercase mb-1">Total Vault Value (USD)</p>
                        <p className="text-lg font-bold text-cyan-400">${(traderAccount.totalSharesValueUsd.toNumber() / 10**6).toFixed(2)}</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                        Your followers' capital is stored in your Vault. When they profit, your commission is automatically deducted during their withdrawal.
                    </p>
                </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-8">
                <h3 className="text-sm font-bold text-cyan-400 uppercase mb-4 tracking-widest">Growth Tips</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Traders with high trade frequency and consistent positive Net P&L appear higher in the rankings. Share your public key to invite investors.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
