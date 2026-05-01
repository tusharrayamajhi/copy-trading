"use client";
import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PLATFORM_BANK_USDC, PLATFORM_BANK_SOL } from '../lib/constants';
import { Landmark } from "lucide-react";

export function BankStatus() {
    const { connection } = useConnection();
    const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
    const [solBalance, setSolBalance] = useState<string>("0.00");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBankBalances = async () => {
            try {
                setLoading(true);
                
                // 1. Fetch USDC balance (Token Account)
                try {
                    const usdcInfo = await connection.getTokenAccountBalance(PLATFORM_BANK_USDC);
                    setUsdcBalance(usdcInfo.value.uiAmountString || "0.00");
                } catch (e) {
                    setUsdcBalance("0.00"); // Not funded yet
                }

                // 2. Fetch SOL balance (MUST use getTokenAccountBalance because it is WSOL)
                try {
                    const solTokenInfo = await connection.getTokenAccountBalance(PLATFORM_BANK_SOL);
                    setSolBalance(solTokenInfo.value.uiAmountString || "0.00");
                } catch (e) {
                    // If no one has sent WSOL yet, it might error or be 0
                    setSolBalance("0.00");
                }

            } catch (error) {
                console.error("Failed to fetch bank balances:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBankBalances();
        const interval = setInterval(fetchBankBalances, 15000);
        return () => clearInterval(interval);
    }, [connection]);

    return (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Landmark className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Platform Liquidity</h3>
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Bank (Internal DEX)</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* USDC Card */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500 font-bold uppercase">Bank USDC Balance</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                        {loading ? "..." : usdcBalance} <span className="text-sm text-slate-500 font-medium">USDC</span>
                    </p>
                    <p className="text-[9px] text-slate-600 mt-1 truncate">{PLATFORM_BANK_USDC.toBase58()}</p>
                </div>

                {/* SOL Card */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500 font-bold uppercase">Bank WSOL Balance</span>
                    </div>
                    <p className="text-2xl font-black text-white">
                        {loading ? "..." : solBalance} <span className="text-sm text-slate-500 font-medium">SOL</span>
                    </p>
                    <p className="text-[9px] text-slate-600 mt-1 truncate">{PLATFORM_BANK_SOL.toBase58()}</p>
                </div>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-[10px] text-blue-400 leading-tight">
                    <strong>Note:</strong> These are the funds the Platform uses to pay traders during swaps. Ensure these accounts are funded or swaps will fail.
                </p>
            </div>
        </div>
    );
}
