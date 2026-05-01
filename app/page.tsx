"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, BarChart3, ShieldCheck, Zap, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-300">Live on Solana Devnet</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">DeFi Markets</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-12 leading-relaxed">
          The ultimate platform for copy trading on Solana. Follow professional traders, 
          manage shared liquidity vaults, and grow your portfolio with transparency.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          {!publicKey ? (
            <div className="scale-110">
              <WalletMultiButton />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="/trader" 
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <BarChart3 className="w-5 h-5" />
                Become a Trader
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/investor" 
                className="group px-8 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Invest in Vaults
              </Link>
            </div>
          )}
        </div>

        {/* Stats / Proof Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheck, label: "Non-Custodial", desc: "Your funds stay in secure PDAs", color: "text-green-400" },
            { icon: Zap, label: "Instant Execution", desc: "Sub-second swaps on Solana", color: "text-yellow-400" },
            { icon: Wallet, label: "Transparent Yield", desc: "Real-time P&L from Pyth feeds", color: "text-blue-400" }
          ].map((item, i) => (
            <div key={i} className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-3xl backdrop-blur-xl hover:border-slate-700/50 transition-colors text-left group">
              <div className={`w-12 h-12 ${item.color} bg-slate-950/50 rounded-xl flex items-center justify-center mb-6 border border-slate-800 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.label}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '48px 48px' }} 
      />
    </main>
  );
}