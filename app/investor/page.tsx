"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAllTraders } from "../../src/hooks/useTraderQueries";
import { useMyInvestments } from "../../src/hooks/useInvestorQueries";
import { useDeposit } from "../../src/hooks/useDeposit";
import { useWithdraw } from "../../src/hooks/useWithdraw";
import { useWrapSol } from "../../src/hooks/useWrapSol";
import { PublicKey } from "@solana/web3.js";
import { Activity, TrendingUp, Search, UserCheck, Layers, Compass, ArrowDownToLine, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function InvestorDashboard() {
  const { publicKey } = useWallet();
  const { traders, loading: loadingTraders } = useAllTraders();
  const { investments, loading: loadingInvestments, refetch: refetchInvestments } = useMyInvestments(publicKey);
  const depositParams = useDeposit();
  const withdrawParams = useWithdraw();
  const { wrap } = useWrapSol();

  const [activeTab, setActiveTab] = useState<"discover" | "portfolio">("discover");
  const [selectedTrader, setSelectedTrader] = useState<any>(null);
  
  const [depositAmount, setDepositAmount] = useState("");
  const [wrapAmount, setWrapAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchKey, setSearchKey] = useState("");

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <UserCheck className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Wallet Not Connected</h2>
        <p className="text-slate-400">Please connect your wallet to view traders and manage investments.</p>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!selectedTrader || !depositAmount) return;
    try {
      setSubmitting(true);
      const lamports = BigInt(Math.floor(parseFloat(depositAmount) * 1e9));
      await depositParams(new PublicKey(selectedTrader.publicKey), lamports);
      toast.success("Deposit successful!");
      setDepositAmount("");
      refetchInvestments();
    } catch (err: any) {
      toast.error(err.message || "Deposit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (traderPubkeyStr: string) => {
    try {
      setSubmitting(true);
      const tz = toast.loading("Processing withdrawal...");
      await withdrawParams(new PublicKey(traderPubkeyStr));
      toast.success("Withdrawal complete!", { id: tz });
      refetchInvestments();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWrap = async () => {
    if (!wrapAmount) return;
    try {
      setSubmitting(true);
      const tz = toast.loading("Wrapping native SOL to WSOL...");
      const lamports = BigInt(Math.floor(parseFloat(wrapAmount) * 1e9));
      await wrap(lamports);
      toast.success("Successfully wrapped SOL into WSOL!", { id: tz });
      setWrapAmount("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Wrap failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTraders = traders
    .filter(t => t.publicKey.includes(searchKey))
    .slice(0, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Invest & Copy</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">Discover top performing traders or manage your active vault allocations.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-slate-800 p-1 rounded-xl flex space-x-2">
          <button 
            onClick={() => setActiveTab("discover")}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "discover" ? "bg-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Compass className="w-4 h-4 mr-2" /> Discover Traders
          </button>
          <button 
            onClick={() => setActiveTab("portfolio")}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "portfolio" ? "bg-cyan-500 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4 mr-2" /> My Portfolio
          </button>
        </div>
      </div>

      {activeTab === "discover" ? (
        // DISCOVER TAB
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Trader List */}
          <div className="lg:col-span-1 bg-slate-800/40 p-6 rounded-2xl border border-slate-700 h-[700px] flex flex-col">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search trader pubkey..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {loadingTraders ? (
                <div className="flex justify-center py-10"><Activity className="w-6 h-6 animate-spin text-cyan-500" /></div>
              ) : filteredTraders.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No traders found.</div>
              ) : (
                filteredTraders.map((trader) => (
                  <button
                    key={trader.publicKey}
                    onClick={() => setSelectedTrader(trader)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedTrader?.publicKey === trader.publicKey 
                      ? "bg-cyan-500/10 border-cyan-500" 
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700"
                    }`}
                  >
                    <p className="text-sm font-mono text-slate-300 truncate mb-2">{trader.publicKey}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-slate-900 px-2 py-1 rounded text-cyan-400 border border-cyan-500/30">Fee: {trader.account.commissionPercentage / 100}%</span>
                      <span className="flex items-center text-green-400">
                        <TrendingUp className="w-3 h-3 mr-1" /> {trader.account.totalTrades?.toNumber() || 0} trades
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Interaction Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedTrader ? (
              <div className="bg-slate-800/20 border border-dashed border-slate-700 h-full min-h-[400px] rounded-2xl flex flex-col items-center justify-center text-slate-500">
                 <Activity className="w-12 h-12 mb-4 opacity-50" />
                 <p>Select a trader from the list to view stats and invest.</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center">
                        Trader Stats <span className="ml-3 text-sm font-normal bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">{Object.keys(selectedTrader.account.currentAsset)[0]?.toUpperCase() || "SOL"}</span>
                      </h2>
                      <p className="text-sm font-mono text-slate-400 mt-2 break-all">{selectedTrader.publicKey}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total Pool Value</p>
                      <p className="text-2xl font-bold">${(selectedTrader.account.totalSharesValueUsd?.toNumber() / 10**6).toFixed(2) || "0.00"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">Lifetime Profit (USD)</p>
                      <p className="text-xl font-bold text-green-400">${(selectedTrader.account.lifetimeProfitUsd?.toNumber() / 10**6).toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">Commission Fee</p>
                      <p className="text-xl font-bold text-cyan-400">{selectedTrader.account.commissionPercentage / 100}%</p>
                    </div>
                  </div>
                </div>

                {/* WRAP NATIVE SOL UTILITY */}
                <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 p-6 rounded-2xl flex items-center justify-between">
                  <div className="max-w-sm">
                    <h3 className="font-bold flex items-center text-cyan-400 mb-1"><RefreshCw className="w-4 h-4 mr-2" /> Prepare your SOL</h3>
                    <p className="text-xs text-slate-300">The program requires Wrapped SOL (WSOL) to deposit. If you only have Native Devnet SOL, wrap it here first.</p>
                  </div>
                  <div className="flex gap-2 w-1/3">
                    <input 
                      type="number" value={wrapAmount} onChange={(e) => setWrapAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                      placeholder="SOL to Wrap"
                    />
                    <button 
                      onClick={handleWrap} disabled={submitting || !wrapAmount}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      Wrap
                    </button>
                  </div>
                </div>

                {/* Deposit Interaction Box */}
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                  <h3 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-6">Deposit WSOL into Vault</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm text-slate-400 mb-2">Amount (WSOL)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-4 text-slate-500 font-bold">WSOL</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleDeposit}
                      disabled={submitting || !depositAmount}
                      className="w-1/3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 text-sm rounded-xl transition-all h-[56px]"
                    >
                      {submitting ? "..." : "DEPOSIT"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-4"><ArrowDownToLine className="w-3 h-3 inline pb-0.5"/> You will receive proportionate Vault Shares in your wallet indicating your ownership pool stake.</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // PORTFOLIO TAB
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {loadingInvestments ? (
             <div className="flex justify-center py-20"><Activity className="w-8 h-8 animate-spin text-cyan-500" /></div>
          ) : investments.length === 0 ? (
             <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-16 text-center text-slate-400">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Investments</h3>
                <p>Head over to the Discover tab to find a trader and deposit funds to start earning.</p>
             </div>
          ) : (
             <div className="space-y-4">
               <h3 className="text-xl font-bold mb-4">Vaults I Am Following</h3>
               {investments.map((inv) => (
                 <div key={inv.publicKey} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                    <div className="flex-1 w-full truncate">
                      <p className="text-sm text-slate-400 mb-1">Trader address</p>
                      <p className="font-mono text-cyan-400 truncate">{inv.account.linkedTrader.toBase58()}</p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                      <p className="text-sm text-slate-400 mb-1">Initial Deposit Snapshot (USD)</p>
                      <p className="text-xl font-bold">${(inv.account.initialDepositUsdValue?.toNumber() / 10**6).toFixed(2) || "0.00"}</p>
                    </div>
                    <button 
                      onClick={() => handleWithdraw(inv.account.linkedTrader.toBase58())}
                      disabled={submitting}
                      className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-bold px-6 py-3 rounded-xl transition-all"
                    >
                      {submitting ? "Withdrawing..." : "Withdraw & Stop Copying"}
                    </button>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
}
