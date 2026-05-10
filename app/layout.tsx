"use client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/src/components/Navbar";
import { AuthProvider } from "@/src/components/AuthProvider";
import { useMemo } from "react";

import { rpcThrottleMiddleware } from "@/src/lib/rpc-limiter";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const network = WalletAdapterNetwork.Devnet;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);
  }, []);
  const connectionConfig = useMemo(() => ({
    fetchMiddleware: rpcThrottleMiddleware,
    commitment: "confirmed" as const,
  }), []);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], []);
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground antialiased min-h-screen flex flex-col"
      >
        <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <TooltipProvider>
                <AuthProvider>
                  <Navbar />
                  <div className="flex-1 mt-16 pt-8 pb-16">
                    {children}
                  </div>
                </AuthProvider>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "var(--card)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                    },
                  }}
                />
              </TooltipProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}