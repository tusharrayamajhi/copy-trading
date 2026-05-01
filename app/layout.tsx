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
import { useMemo } from "react";

const network = WalletAdapterNetwork.Devnet;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(network), []);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], []);
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-50 antialiased min-h-screen flex flex-col">
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <Navbar />
              <div className="flex-1 mt-16 pt-8 pb-16">
                {children}
              </div>
              <Toaster position="bottom-right" toastOptions={{
                style: { background: '#1e293b', color: '#fff' }
              }} />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}