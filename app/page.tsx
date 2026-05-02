"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  Wallet,
  TrendingUp,
  ChevronRight,
  Globe,
  Lock,
  Cpu
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden selection:bg-cyan-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 z-[1] opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '64px 64px' }}
      />



      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Protocol v1.0 Live</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter italic">
              COPY TRADING <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                REIMAGINED.
              </span>
            </h1>

            <p className="max-w-xl text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-medium">
              Join the first non-custodial copy-trading protocol on Solana.
              Follow elite traders with sub-second execution and institutional-grade security.
            </p>
            <div className="mt-16 flex items-center gap-8 grayscale opacity-50 overflow-hidden">
              <div className="flex items-center gap-2 font-black italic text-2xl tracking-tighter">SOLANA</div>
              <div className="flex items-center gap-2 font-black italic text-2xl tracking-tighter uppercase">Pyth</div>
              <div className="flex items-center gap-2 font-black italic text-2xl tracking-tighter uppercase underline underline-offset-8">Jupiter</div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-[3rem] -rotate-3 blur-2xl" />
            <div className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 overflow-hidden">
              <img
                src="/trading_terminal_ui.png"
                alt="Antigravity Interface"
                className="rounded-[2.5rem] w-full shadow-2xl"
              />
              <div className="absolute bottom-10 left-10 right-10 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold tracking-widest text-slate-400">LIVE EXECUTION</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400">+$1,452.20</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[70%] animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section id="features" className="relative z-10 py-32 bg-slate-950/50 backdrop-blur-3xl border-y border-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black italic mb-6">BUILT FOR PERFORMANCE.</h2>
            <p className="text-slate-500 text-lg">We've combined the speed of Solana with institutional security to create the ultimate trading environment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: "PDA Security", desc: "Your assets are locked in Program Derived Addresses, accessible only through immutable smart contract logic.", color: "from-blue-500 to-cyan-500" },
              { icon: Globe, title: "Oracle Integrity", desc: "Real-time pricing powered by Pyth Network ensures fair execution and accurate P&L tracking.", color: "from-purple-500 to-indigo-600" },
              { icon: Cpu, title: "Sub-Second Swaps", desc: "Built directly on Solana for near-instant transaction finality and minimal slippage.", color: "from-orange-500 to-rose-500" }
            ].map((feature, i) => (
              <div key={i} className="group p-10 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] hover:border-slate-600 transition-all">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Final Section */}
      <section className="relative z-10 container mx-auto px-6 py-40 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-12 md:p-20 rounded-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />

          <h2 className="text-4xl md:text-7xl font-black italic mb-8 tracking-tight">READY TO <br />ASCEND?</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">Join thousands of investors and professional traders who have already migrated to the future of DeFi copy trading.</p>

          <div className="flex flex-wrap justify-center gap-6">
            {!publicKey ? (
              <div className="scale-125">
                <WalletMultiButton />
              </div>
            ) : (
              <Link href="/investor" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all flex items-center gap-3">
                LAUNCH DASHBOARD <ChevronRight className="w-6 h-6" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}