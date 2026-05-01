"use client";

import Link from "next/link";
import { ArrowRight, Trophy, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          The Premier <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            DeFi Copy Trading
          </span><br/>
          Protocol on Solana
        </h1>
        <p className="text-xl text-slate-400 mb-10 leading-relaxed">
          Non-custodial, fully on-chain copy trading. Mirror the best performing traders instantly, or become a Leader and earn commissions on profitable trades.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/investor" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/30">
            Invest Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link href="/trader" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-cyan-400 bg-slate-800 border border-cyan-500/30 rounded-xl hover:bg-slate-700 hover:border-cyan-400 transition-all">
            Become a Trader
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full mt-12">
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center text-center">
          <div className="bg-blue-500/20 p-4 rounded-xl mb-6">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
          <p className="text-slate-400">Powered by Solana Jupiter V6, ensuring near-instant trade execution and optimal swap routing.</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center text-center">
          <div className="bg-cyan-500/20 p-4 rounded-xl mb-6">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">100% Non-Custodial</h3>
          <p className="text-slate-400">Traders never access your underlying funds. You maintain complete control of your assets via Vault Shares.</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center text-center">
          <div className="bg-purple-500/20 p-4 rounded-xl mb-6">
            <Trophy className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Earn Commissions</h3>
          <p className="text-slate-400">Experienced traders earn up to 20% performance fees on pure profit generated for their followers.</p>
        </div>
      </div>
    </main>
  );
}