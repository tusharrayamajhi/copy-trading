"use client";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowRightLeft, Landmark } from "lucide-react";
import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PLATFORM_BANK_SOL, PLATFORM_BANK_USDC } from "../lib/constants";

export default function Navbar() {
  const { connection } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [bankBalances, setBankBalances] = useState<{ sol: number, usdc: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchBankBalances = async () => {
        try {
            // 1. Fetch SOL balance (Native SOL is easier for testing)
            let solAmount = 0;
            try {
                const nativeSolBal = await connection.getBalance(PLATFORM_BANK_SOL);
                solAmount = nativeSolBal / 1e9;
            } catch (e) {
                console.warn("Could not fetch Native SOL balance");
            }
            
            // 2. Fetch USDC balance (Token Account)
            let usdcAmount = 0;
            try {
                const usdcBal = await connection.getTokenAccountBalance(PLATFORM_BANK_USDC);
                usdcAmount = Number(usdcBal.value.amount) / 1e6;
            } catch (e) {
                console.warn("USDC Bank (Token Account) not initialized yet");
            }

            setBankBalances({
                sol: solAmount,
                usdc: usdcAmount
            });
        } catch (e) {
            console.error("Critical error fetching bank balances:", e);
        }
    };
    fetchBankBalances();
    const interval = setInterval(fetchBankBalances, 10000);
    return () => clearInterval(interval);
  }, [connection]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-cyan-500/20 p-2 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              SolCopy
            </span>
          </Link>
          <div className="hidden md:flex space-x-6 items-center font-medium">
            <Link href="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <Link href="/trader" className="text-slate-300 hover:text-white transition">Trader Portal</Link>
            <Link href="/investor" className="text-slate-300 hover:text-white transition">Investor Portal</Link>
            
            {/* Bank Testing Info */}
            <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full">
                <Landmark className="w-4 h-4 text-amber-500" />
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tighter">
                    <div className="flex flex-col">
                        <span className="text-slate-500">Bank SOL</span>
                        <span className="text-amber-500">{bankBalances?.sol.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800 self-center" />
                    <div className="flex flex-col">
                        <span className="text-slate-500">Bank USDC</span>
                        <span className="text-amber-500">${bankBalances?.usdc.toFixed(2) || "0.00"}</span>
                    </div>
                </div>
            </div>
          </div>
          <div className="flex items-center">
            {mounted ? (
              <WalletMultiButton className="!bg-cyan-500 hover:!bg-cyan-600 transition-colors rounded-xl" />
            ) : (
              <div className="w-[150px] h-10 bg-slate-800 rounded-xl animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
