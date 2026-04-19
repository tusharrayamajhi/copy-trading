"use client";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <div className="hidden md:flex space-x-8 items-center font-medium">
            <Link href="/" className="text-slate-300 hover:text-white transition">Home</Link>
            <Link href="/trader" className="text-slate-300 hover:text-white transition">Trader Portal</Link>
            <Link href="/investor" className="text-slate-300 hover:text-white transition">Investor Portal</Link>
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
