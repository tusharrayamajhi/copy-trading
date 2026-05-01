"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useTraderAccount } from "../../src/hooks/useTraderQueries";
import { useCreateTrader } from "../../src/hooks/useCreateTrader";
import { useSignalSwap } from "../../src/hooks/useSignalSwap";
import PriceChart from "../../src/components/PriceChart";
import { Activity, Copy, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

export default function TraderDashboard() {
  const { publicKey } = useWallet();
  const { data: traderData, loading, refetch } = useTraderAccount(publicKey);
  const createTrader = useCreateTrader();
  const signalSwap = useSignalSwap();
  
  const [commission, setCommission] = useState("10"); // 10%
  const [submitting, setSubmitting] = useState(false);

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Wallet Not Connected</h2>
        <p className="text-slate-400">Please connect your wallet to access the Trader Portal.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center mt-20"><Activity className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  }

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const commissionBps = parseInt(commission) * 100;
      await createTrader(commissionBps);
      toast.success("Trader account created!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create trader account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async (targetAsset: "Sol" | "Usdc") => {
    try {
      setSubmitting(true);
      await signalSwap(targetAsset);
      toast.success(`Successfully swapped pool to ${targetAsset}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Swap failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!traderData) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Initialize Trader Profile</h2>
          <p className="text-slate-400 mb-8">Set up your trader account to allow others to copy your trades. You'll earn a percentage of pure profits you generate for your followers.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Commission Percentage (%)</label>
              <input 
                type="number" 
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="e.g. 10 for 10%"
              />
              <p className="text-xs text-slate-500 mt-2">Maximum is 100% (10000 bps). Standard is 10-20%.</p>
            </div>
            
            <button 
              onClick={handleCreate}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {submitting ? "Initializing..." : "Create Trader Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine current active asset
  const currentAssetKey = Object.keys(traderData.currentAsset || {})[0]?.toUpperCase() || "SOL";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trader Dashboard</h1>
          <div className="flex items-center text-sm text-slate-400 mt-2">
            <span className="bg-slate-800 px-2 py-1 rounded truncate max-w-xs">{publicKey.toBase58()}</span>
            <button onClick={() => { navigator.clipboard.writeText(publicKey.toBase58()); toast.success("Copied"); }} className="ml-2 hover:text-white">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="bg-slate-800/80 border border-slate-700 px-6 py-3 rounded-xl flex items-center">
            <span className="text-slate-400 mr-2">Commission:</span>
            <span className="text-cyan-400 font-bold">{(traderData.commissionPercentage / 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {(() => {
         const initialUsd = traderData.totalSharesValueUsd?.toNumber() / 10**6 || 0;
         
         return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
             <p className="text-slate-400 text-sm mb-1">Total Pool USD Value (Deposits)</p>
             <p className="text-3xl font-bold">${initialUsd.toFixed(2)}</p>
           </div>
           <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
             <p className="text-slate-400 text-sm mb-1">Total Signals Executed</p>
             <p className="text-3xl font-bold">{traderData.totalTrades?.toNumber() || 0}</p>
           </div>
         </div>
         );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl">
             <PriceChart symbol="Solana" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Signal Execution</h3>
            <p className="text-sm text-slate-400 mb-6">Swapping triggers standard Jupiter routing across all vault funds instantly, rebalancing your followers.</p>
            
            <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-sm text-slate-400">Current Position:</span>
              <span className="font-bold flex items-center text-cyan-400">
                 <CheckCircle2 className="w-4 h-4 mr-1" /> {currentAssetKey}
              </span>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleSwap("Usdc")}
                disabled={submitting || currentAssetKey === "USDC"}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  currentAssetKey === "USDC" 
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50"
                }`}
              >
                {submitting ? "Working..." : "Sell to USDC (Risk Off)"}
              </button>

              <button 
                onClick={() => handleSwap("Sol")}
                disabled={submitting || currentAssetKey === "SOL"}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  currentAssetKey === "SOL" 
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/50"
                }`}
              >
                {submitting ? "Working..." : "Buy SOL (Risk On)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
