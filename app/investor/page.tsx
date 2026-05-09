"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAllTraders } from "../../src/hooks/useTraderQueries";
import { useMyInvestments } from "../../src/hooks/useInvestorQueries";
import { useDeposit } from "../../src/hooks/useDeposit";
import { useWithdraw } from "../../src/hooks/useWithdraw";
import { useWrapSol } from "../../src/hooks/useWrapSol";
import { PublicKey } from "@solana/web3.js";
import { 
    Search, Wallet, TrendingUp, Shield, BarChart3, ArrowUpRight, 
    DollarSign, Activity, Users, ChevronRight, Vault, ArrowDownRight,
    Filter, LayoutGrid, List, Info, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { TransactionHistory } from "../../src/components/TransactionHistory";
import { useInvestmentLiveStats } from "../../src/hooks/useInvestmentLiveStats";

// --- Sub-components for better organization ---

function TraderRow({ trader, index, submitting, onDeposit, manualPrice }: { 
  trader: any, 
  index: number, 
  submitting: boolean, 
  onDeposit: (wallet: string, amount: number) => void,
  manualPrice: string 
}) {
  const [amount, setAmount] = useState<string>("0.1");
  const commission = trader.account.commissionPercentage / 100;
  const profit = (trader.account.lifetimeProfitUsd.toNumber() - trader.account.lifetimeLossUsd.toNumber()) / 10 ** 6;
  const currentAsset = Object.keys(trader.account.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";

  return (
    <tr className="group hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
      <td className="py-6 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-500 tabular-nums">{(index + 1).toString().padStart(2, '0')}</span>
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/20">
            <Users className="text-cyan-400 w-4 h-4" />
          </div>
        </div>
      </td>
      <td className="py-6 px-4">
        <Link href={`/trader/${trader.account.traderWallet.toBase58()}`} className="hover:text-cyan-400 transition-colors">
          <p className="text-sm font-bold text-slate-200">{trader.account.traderWallet.toBase58().slice(0, 4)}...{trader.account.traderWallet.toBase58().slice(-4)}</p>
          <p className="text-[10px] text-slate-500 font-mono">Trader ID</p>
        </Link>
      </td>
      <td className="py-6 px-4">
        <div className={`flex items-center gap-1.5 ${profit > 0.01 ? "text-green-400" : profit < -0.01 ? "text-red-400" : "text-slate-400"}`}>
          {profit > 0.01 ? <TrendingUp className="w-3 h-3" /> : profit < -0.01 ? <ArrowDownRight className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
          <span className="text-sm font-black">${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </td>
      <td className="py-6 px-4">
        <span className="text-sm font-medium text-slate-300">{commission}%</span>
      </td>
      <td className="py-6 px-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
          currentAsset === "SOL" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
        }`}>
          {currentAsset}
        </span>
      </td>
      <td className="py-6 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <input
              type="number"
              className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-600">SOL</span>
          </div>
          <button
            onClick={() => onDeposit(trader.account.traderWallet.toBase58(), Number(amount))}
            disabled={submitting}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            DEPOSIT
          </button>
        </div>
      </td>
    </tr>
  );
}

function InvestmentRow({ inv, stats, trader, manualPrice, handleWithdraw, submitting }: any) {
    const initialUsd = inv.account.initialDepositUsdValue?.toNumber() / 10 ** 6 || 0;
    const currentAsset = Object.keys(trader?.account?.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";
    const stat = stats[inv.publicKey];

    const solPrice = Number(manualPrice) || 1;
    const netSolReturn = (stat?.currentValue || 0) / solPrice;
    const grossSolReturn = (stat?.grossValue || 0) / solPrice;

    return (
        <tr className="group hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
            <td className="py-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                        <Vault className="text-purple-400 w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-200">#{inv.publicKey.slice(0, 6)}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">
                                {stat?.ownershipPercentage?.toFixed(2)}% OWNERSHIP
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="py-6 px-4">
                <p className="text-sm font-medium text-slate-300">{trader?.account?.traderWallet?.toBase58()?.slice(0, 4)}...{trader?.account?.traderWallet?.toBase58()?.slice(-4)}</p>
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Strategy: {currentAsset}</p>
                </div>
            </td>
            <td className="py-6 px-4">
                <p className="text-sm font-bold text-slate-200">${initialUsd.toFixed(2)}</p>
                <p className="text-[9px] text-slate-500 font-mono uppercase">Cost Basis</p>
            </td>
            <td className="py-6 px-4">
                <div className="space-y-1">
                    <p className="text-sm font-black text-white">${stat?.grossValue?.toFixed(2) || "0.00"}</p>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-500 uppercase flex justify-between">
                            <span>Trader Fee:</span>
                            <span className="text-red-400/80">-${stat?.traderCommissionUsd?.toFixed(2) || "0.00"}</span>
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase flex justify-between">
                            <span>Platform:</span>
                            <span className="text-red-400/80">-${stat?.platformFeeUsd?.toFixed(2) || "0.00"}</span>
                        </span>
                    </div>
                </div>
            </td>
            <td className="py-6 px-4">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-cyan-400">{netSolReturn.toFixed(4)} SOL</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        ≈ ${(stat?.currentValue || 0).toFixed(2)} NET
                    </span>
                </div>
            </td>
            <td className="py-6 px-4 text-right">
                <button
                    onClick={() => handleWithdraw(inv)}
                    disabled={submitting || !stat || stat.shares <= 0}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 transition-all text-xs disabled:opacity-30"
                >
                    WITHDRAW
                </button>
            </td>
        </tr>
    );
}

export default function InvestorDashboard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [wsolBalance, setWsolBalance] = useState<number | null>(null);
  const { traders, loading: loadingTraders, refetch: refetchTraders } = useAllTraders();
  const { investments, loading: loadingInvestments, refetch: refetchInvestments } = useMyInvestments(publicKey, traders);

  const [manualPrice, setManualPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"investments" | "discover">("investments");
  const [search, setSearch] = useState("");

  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { wrap } = useWrapSol();
  const { stats: liveStats, loading: loadingStats } = useInvestmentLiveStats(publicKey, investments, traders, Number(manualPrice));

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
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!publicKey || !connection) return;
    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setWalletBalance(bal / 1e9);

        const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
        const { WSOL_MINT } = await import("../../src/lib/constants");
        const ata = getAssociatedTokenAddressSync(WSOL_MINT, publicKey);
        try {
          const tokenBal = await connection.getTokenAccountBalance(ata);
          setWsolBalance(Number(tokenBal.value.amount) / 1e9);
        } catch (e) {
          setWsolBalance(0);
        }
      } catch (e) {
        console.error("Failed to fetch balances");
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleDeposit = async (traderWallet: string, requestedAmount: number) => {
    try {
      setSubmitting(true);
      const lamports = BigInt(Math.floor(requestedAmount * 1e9));

      const currentWsol = wsolBalance || 0;
      if (currentWsol < requestedAmount) {
        const needed = requestedAmount - currentWsol;
        toast.loading(`Wrapping ${needed.toFixed(3)} SOL...`, { id: "deposit" });
        await wrap(needed);
        await new Promise(r => setTimeout(r, 2000));
      }

      toast.loading("Depositing to Vault...", { id: "deposit" });
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Invalid SOL price");

      await deposit(new PublicKey(traderWallet), lamports, price);

      toast.success("Deposit successful!", { id: "deposit" });
      refetchInvestments();
      refetchTraders();
    } catch (err: any) {
      toast.error(err.message || "Deposit failed", { id: "deposit" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (investment: any) => {
    try {
      setSubmitting(true);
      toast.loading("Withdrawing from Vault...", { id: "withdraw" });
      
      const traderPda = typeof investment.linkedTraderPubkey === 'string' ? investment.linkedTraderPubkey : investment.linkedTraderPubkey.toString();
      await withdraw(new PublicKey(traderPda), Number(manualPrice));
      
      toast.success("Withdrawal successful!", { id: "withdraw" });
      refetchInvestments();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed", { id: "withdraw" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-slate-400">Join the future of decentralized copy trading.</p>
      </div>
    );
  }

  const filteredTraders = traders
    .filter(t => t.publicKey.toLowerCase().includes(search.toLowerCase()) || t.account.traderWallet.toBase58().toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const profitA = a.account.lifetimeProfitUsd.toNumber() - a.account.lifetimeLossUsd.toNumber();
      const profitB = b.account.lifetimeProfitUsd.toNumber() - b.account.lifetimeLossUsd.toNumber();
      return profitB - profitA;
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <BarChart3 className="text-slate-950 w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black italic tracking-tighter text-white">INVESTOR PORTAL</h1>
          </div>
          <p className="text-slate-500 font-mono text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            CONNECTED: {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-6)}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center gap-8">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Native SOL</p>
                    <p className="text-xl font-black text-white leading-none">{walletBalance?.toFixed(3) || "0.000"}</p>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Wrapped SOL</p>
                    <p className="text-xl font-black text-cyan-400 leading-none">{wsolBalance?.toFixed(3) || "0.000"}</p>
                </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Oracle Price</p>
                    <p className="text-xl font-black text-white leading-none">${manualPrice || "..."}</p>
                </div>
                <button 
                    onClick={() => { refetchInvestments(); refetchTraders(); }}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all group"
                >
                    <RefreshCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>
        </div>
      </div>

      {/* --- PORTFOLIO OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-20 h-20 text-cyan-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Allocated</p>
            <p className="text-3xl font-black text-white">
              ${investments.reduce((acc, inv) => acc + (inv.account.initialDepositUsdValue.toNumber() / 1e6), 0).toFixed(2)}
            </p>
          </div>
          <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Vault className="w-20 h-20 text-purple-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Portfolio Value</p>
            <p className="text-3xl font-black text-cyan-400">
              ${Object.values(liveStats).reduce((acc, s) => acc + s.currentValue, 0).toFixed(2)}
            </p>
          </div>
          <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-20 h-20 text-green-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Net Unrealized P&L</p>
            {(() => {
                const totalPnl = Object.values(liveStats).reduce((acc, s) => acc + s.pnl, 0);
                const pnlColor = totalPnl > 0.01 ? "text-green-400" : totalPnl < -0.01 ? "text-red-400" : "text-slate-400";
                return (
                    <p className={`text-3xl font-black ${pnlColor}`}>
                        ${totalPnl.toFixed(2)}
                    </p>
                );
            })()}
          </div>
      </div>

      {/* --- SECTION TABS --- */}
      <div className="flex items-center gap-2 mb-8 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button 
            onClick={() => setActiveTab("investments")}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "investments" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Vault className="w-4 h-4" /> ACTIVE INVESTMENTS
          </button>
          <button 
            onClick={() => setActiveTab("discover")}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "discover" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" /> FIND TRADERS
          </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-sm">
        {activeTab === "investments" ? (
            <div className="p-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vault Detail</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Provider</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gross Equity</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">P&L Status</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingInvestments ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-500 font-bold text-sm">Syncing on-chain positions...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : investments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                                                <Info className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-400 font-medium">No active investments found.</p>
                                            <button 
                                                onClick={() => setActiveTab("discover")}
                                                className="text-cyan-400 text-xs font-black uppercase hover:underline"
                                            >
                                                Start Copy-Trading Now →
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                investments.map((inv) => (
                                    <InvestmentRow 
                                        key={inv.publicKey}
                                        inv={inv}
                                        stats={liveStats}
                                        trader={traders.find(t => t.publicKey === inv.linkedTraderPubkey)}
                                        manualPrice={manualPrice}
                                        handleWithdraw={handleWithdraw}
                                        submitting={submitting}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="p-2">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search by trader address..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sort: Lifetime ROI</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Provider</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lifetime P&L</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fee %</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategy</th>
                                <th className="py-5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingTraders ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-500 font-bold text-sm">Discovering top traders...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTraders.map((trader, index) => (
                                <TraderRow 
                                    key={trader.publicKey}
                                    trader={trader}
                                    index={index}
                                    submitting={submitting}
                                    onDeposit={handleDeposit}
                                    manualPrice={manualPrice}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
        <div className="group bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] flex gap-6 hover:bg-slate-900 transition-all">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Shield className="text-cyan-400 w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black tracking-tight text-white italic">SECURE PDAs</h4>
            <p className="text-slate-400 text-sm leading-relaxed">All funds are mathematically locked in Program Derived Addresses. Traders cannot rug-pull; only the investor can burn shares to reclaim assets.</p>
          </div>
        </div>
        <div className="group bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] flex gap-6 hover:bg-slate-900 transition-all">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Vault className="text-blue-400 w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black tracking-tight text-white italic">INSTANT EXIT</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Exit any strategy at any time. Your shares are liquid and can be redeemed for SOL/USDC based on the real-time value of the vault's assets.</p>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <TransactionHistory wallet={publicKey} isTrader={false} />
      </div>
    </div>
  );
}
