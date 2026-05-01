"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useAllTraders } from "../../src/hooks/useTraderQueries";
import { useMyInvestments } from "../../src/hooks/useInvestorQueries";
import { useDeposit } from "../../src/hooks/useDeposit";
import { useWithdraw } from "../../src/hooks/useWithdraw";
import { useWrapSol } from "../../src/hooks/useWrapSol";
import { PublicKey } from "@solana/web3.js";
import { Search, Wallet, TrendingUp, Shield, BarChart3, ArrowUpRight, DollarSign, Activity, Users, ChevronRight, Vault } from "lucide-react";
import toast from "react-hot-toast";
import { BankStatus } from "../../src/components/BankStatus";

export default function InvestorDashboard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [wsolBalance, setWsolBalance] = useState<number | null>(null);
  const { traders, loading: loadingTraders, refetch: refetchTraders } = useAllTraders();
  const { investments, loading: loadingInvestments, refetch: refetchInvestments } = useMyInvestments(publicKey, traders);
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { wrap } = useWrapSol();

  const [amount, setAmount] = useState<string>("0.1");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
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
    const interval = setInterval(fetchPrice, 10000); // 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!publicKey || !connection) return;
    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setWalletBalance(bal / 1e9);

        // Fetch WSOL Balance
        const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
        const { WSOL_MINT } = await import("../../src/lib/constants");
        const ata = getAssociatedTokenAddressSync(WSOL_MINT, publicKey);
        try {
          const tokenBal = await connection.getTokenAccountBalance(ata);
          setWsolBalance(Number(tokenBal.value.amount) / 1e9);
        } catch (e) {
          setWsolBalance(0); // ATA probably doesn't exist
        }
      } catch (e) {
        console.error("Failed to fetch balances");
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleDeposit = async (traderWallet: string) => {
    try {
      setSubmitting(true);
      const requestedAmount = Number(amount);
      const lamports = BigInt(Math.floor(requestedAmount * 1e9));

      // Check if we need to wrap more SOL
      const currentWsol = wsolBalance || 0;
      if (currentWsol < requestedAmount) {
        const needed = requestedAmount - currentWsol;
        toast.loading(`Wrapping ${needed.toFixed(3)} SOL...`, { id: "deposit" });
        await wrap(needed);
        // Wait a bit for the wrap to confirm on-chain before depositing
        await new Promise(r => setTimeout(r, 2000));
      } else {
        toast.loading("Using existing Wrapped SOL...", { id: "deposit" });
      }

      toast.loading("Depositing to Vault...", { id: "deposit" });
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Please enter a valid price");

      await deposit(new PublicKey(traderWallet), lamports);

      toast.success("Deposit successful!", { id: "deposit" });
      refetchInvestments();
      refetchTraders();
    } catch (err: any) {
      toast.error(err.message || "Deposit failed", { id: "deposit" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (traderPubkey: string) => {
    try {
      setSubmitting(true);
      toast.loading("Closing investment...", { id: "withdraw" });
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Please enter a valid price");

      await withdraw(new PublicKey(traderPubkey), price);
      toast.success("Withdrawal successful! Initial + Profit returned.", { id: "withdraw" });
      refetchInvestments();
      refetchTraders();
    } catch (err: any) {
      toast.error(err.message || "Withdraw failed", { id: "withdraw" });
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
        <p className="text-slate-400">Connect your wallet to start following top signal providers.</p>
      </div>
    );
  }

  const filteredTraders = traders.filter(t => t.publicKey.toLowerCase().includes(search.toLowerCase()) || t.account.traderWallet.toBase58().toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent italic tracking-tighter">INVESTOR DASHBOARD</h1>
          <p className="text-slate-400 font-mono text-sm">{publicKey.toBase58()}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Native SOL</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xl font-black text-white">{walletBalance?.toFixed(3) || "0.000"}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Wrapped SOL</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                <p className="text-xl font-black text-cyan-400">{wsolBalance?.toFixed(3) || "0.000"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* My Portfolio Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Activity className="text-cyan-400 w-8 h-8" /> Active Investments
        </h2>

        {loadingInvestments ? (
          <div className="h-40 flex items-center justify-center bg-slate-900/30 border border-slate-800/50 rounded-3xl animate-pulse">
            <p className="text-slate-500">Loading your portfolio...</p>
          </div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 mb-4">You haven't invested in any vaults yet.</p>
            <p className="text-sm text-slate-600">Browse the signal providers below to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investments.map((inv) => {
              const linkedTrader = traders.find(t => t.publicKey === inv.linkedTraderPubkey);
              const initialUsd = inv.account.initialDepositUsdValue?.toNumber() / 10 ** 6 || 0;
              const currentAsset = Object.keys(linkedTrader?.account?.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";

              return (
                <div key={inv.publicKey} className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/30 transition-all shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-cyan-400 w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Asset</p>
                      <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-md text-xs font-bold border border-cyan-500/20">{currentAsset}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-slate-500 mb-1 font-mono truncate">{inv.linkedTraderPubkey}</p>
                    <h3 className="text-lg font-bold">Signal Vault</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Initial Value</p>
                      <p className="font-bold text-slate-200">${initialUsd.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Shares Count</p>
                      <p className="font-bold text-cyan-400">Equity Position</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWithdraw(inv.linkedTraderPubkey)}
                    disabled={submitting}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Withdraw Initial + Profits
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Platform Liquidity Info */}
      <div className="mb-16 max-w-lg">
        <BankStatus />
      </div>

      {/* Explore Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Search className="text-blue-400 w-8 h-8" /> Discover Traders
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Price</span>
              <input
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                className="bg-transparent border-none text-cyan-400 font-bold w-20 focus:outline-none text-sm"
              />
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {loadingTraders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-900 animate-pulse rounded-3xl border border-slate-800" />)}
          </div>
        ) : filteredTraders.length === 0 ? (
          <div className="p-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800">
            <p className="text-slate-500">No active traders found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTraders.map((trader) => {
              const commission = trader.account.commissionPercentage / 100;
              const profit = (trader.account.lifetimeProfitUsd.toNumber() - trader.account.lifetimeLossUsd.toNumber()) / 10 ** 6;
              const currentAsset = Object.keys(trader.account.currentAsset || {})[0]?.toLowerCase() === "usdc" ? "USDC" : "SOL";

              return (
                <div key={trader.publicKey} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-600 transition-all group flex flex-col h-full shadow-2xl">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Users className="text-white w-7 h-7" />
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {profit >= 0 ? "+" : ""}${Math.abs(profit).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lifetime P&L</p>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">Top Signal Provider <ChevronRight className="w-4 h-4 text-slate-600" /></h3>
                      <p className="text-xs text-slate-500 font-mono truncate">{trader.account.traderWallet.toBase58()}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">Commission</span>
                        <span className="text-sm font-bold text-slate-200">{commission}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-sm text-slate-400">Total Trades</span>
                        <span className="text-sm font-bold text-slate-200">{trader.account.totalTrades.toString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-400">Currently Trading</span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-wider">{currentAsset}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-950 border-t border-slate-800">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input
                          type="number"
                          placeholder="SOL"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeposit(trader.account.traderWallet.toBase58())}
                      disabled={submitting}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? "Processing..." : <>Deposit SOL & Follow <ArrowUpRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-[10px] text-center text-slate-600 mt-4 uppercase font-bold tracking-tighter">SOL will be wrapped into WSOL before deposit</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-24">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex gap-6">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <Shield className="text-cyan-400 w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Vault Security</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Funds are stored in Program Derived Addresses (PDAs). Only you can withdraw your principal and profits by burning your unique Vault Shares.</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex gap-6">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <Vault className="text-blue-400 w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Liquidity Pools</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Your capital joins the trader's vault and is swapped between WSOL and USDC in the platform bank as the trader signals strategy changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
