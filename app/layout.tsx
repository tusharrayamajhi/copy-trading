import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import Navbar from "@/src/components/Navbar";
import { Providers } from "@/src/components/Providers";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CopyCat | Solana Copy-Trading",
  description: "A premium, non-custodial decentralized copy-trading platform built for the Solana ecosystem.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        className="bg-background text-foreground antialiased min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          <div className="flex-1 mt-16 pt-8 pb-16">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}