"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import { rpcThrottleMiddleware } from "@/src/lib/rpc-limiter";
import { AuthProvider } from "@/src/components/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";

const network = WalletAdapterNetwork.Devnet;

export function Providers({ children }: { children: React.ReactNode }) {
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
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <TooltipProvider>
            <AuthProvider>
              {children}
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
  );
}
