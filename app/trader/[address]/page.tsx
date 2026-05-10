"use client";

import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useTraderAccount } from "../../../src/hooks/useTraderQueries";
import { PublicKey } from "@solana/web3.js";
import {
  ArrowLeft,
  BarChart3,
  Shield,
  Users,
  ArrowUpRight,
  Clock,
  Target,
  Zap,
  Info,
  RefreshCw,
  Copy,
  Settings,
} from "lucide-react";
import { TransactionHistory } from "../../../src/components/TransactionHistory";
import { PnLChart } from "../../../src/components/PnLChart";
import toast from "react-hot-toast";
import { useDeposit } from "../../../src/hooks/useDeposit";
import { useWrapSol } from "../../../src/hooks/useWrapSol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
export default function TraderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const { publicKey } = useWallet();

  const traderPubkey = new PublicKey(address);
  const { data: traderAccount, loading, refetch } = useTraderAccount(traderPubkey);

  const deposit = useDeposit();
  const { wrap } = useWrapSol();

  const [amount, setAmount] = useState<string>("0.1");
  const [submitting, setSubmitting] = useState(false);
  const [manualPrice, setManualPrice] = useState<string>("...");

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { getSolPrice } = await import("../../../src/lib/price");
        const price = await getSolPrice();
        setManualPrice(price.toFixed(2));
      } catch {
        setManualPrice("145.00");
      }
    };
    fetchPrice();
  }, []);

  const handleDeposit = async () => {
    if (!publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      setSubmitting(true);
      const requestedAmount = Number(amount);
      const lamports = BigInt(Math.floor(requestedAmount * 1e9));
      toast.loading("Wrapping SOL…", { id: "deposit" });
      try {
        await wrap(requestedAmount);
      } catch {
        throw new Error("Failed to wrap SOL. Check your balance.");
      }
      toast.loading("Depositing…", { id: "deposit" });
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Invalid SOL price");
      await deposit(traderPubkey, lamports, price);
      toast.success("Deposit successful.", { id: "deposit" });
      refetch();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Deposit failed",
        { id: "deposit" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <Skeleton className="size-10 rounded-full" />
      </div>
    );
  }

  if (!traderAccount) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <Card className="ring-border/80">
          <CardHeader>
            <CardTitle>Trader not found</CardTitle>
            <CardDescription>
              This address is not a registered trader on this deployment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profit =
    (traderAccount.lifetimeProfitUsd.toNumber() -
      traderAccount.lifetimeLossUsd.toNumber()) /
    1e6;
  const currentAsset =
    Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc"
      ? "USDC"
      : "SOL";
  const pnlClass =
    profit > 0.01 ? "text-chart-2" : profit < -0.01 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {publicKey?.toBase58() === address && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/trader/settings")}
                className="gap-2"
              >
                <Settings className="size-4" />
                Settings
              </Button>
            )}
            <Badge variant="secondary">Trader profile</Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <Card className="ring-border/60">
              <CardHeader>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 overflow-hidden">
                    {traderAccount.avatarUrl ? (
                      <img src={traderAccount.avatarUrl} alt={traderAccount.name || "Trader"} className="size-full object-cover" />
                    ) : (
                      <Users className="size-9 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-xl sm:text-2xl">
                        {traderAccount.name || "Signal provider"}
                      </CardTitle>
                      <Badge variant="outline" className="text-chart-2">
                        Active
                      </Badge>
                    </div>
                    {traderAccount.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {traderAccount.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2 py-1 text-xs">
                        {address}
                      </code>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={copyAddress}
                        aria-label="Copy address"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Lifetime P&amp;L
                        </p>
                        <p className={`text-lg font-semibold tabular-nums ${pnlClass}`}>
                          {profit > 0.01 ? "+" : ""}$
                          {Math.abs(profit).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Trades
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                          {traderAccount.totalTrades.toString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Fee
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-primary">
                          {traderAccount.commissionPercentage / 100}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Asset
                        </p>
                        <p className="text-lg font-semibold uppercase">
                          {currentAsset}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="ring-border/60">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-primary" />
                  Market
                </CardTitle>
                <Badge variant="secondary">Oracle ${manualPrice}</Badge>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <PnLChart address={address} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Live Market View
                    </p>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      BINANCE:{currentAsset === "SOL" ? "SOLUSDT" : "USDCUSDT"}
                    </Badge>
                  </div>
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-border">
                    <iframe
                      title="Chart"
                      src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE%3A${currentAsset === "SOL" ? "SOLUSDT" : "USDCUSDT"}&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&locale=en`}
                      className="size-full border-0"
                    />
                  </div>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <Card className="bg-muted/20 ring-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary">
                        <Target className="size-4" />
                        <CardTitle className="text-sm">Strategy</CardTitle>
                      </div>
                      <CardDescription className="text-xs leading-relaxed">
                        Currently allocated to {currentAsset}. Exposure updates
                        when the trader rotates the vault.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="bg-muted/20 ring-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary">
                        <Shield className="size-4" />
                        <CardTitle className="text-sm">Security</CardTitle>
                      </div>
                      <CardDescription className="text-xs leading-relaxed">
                        Non-custodial PDAs: you hold shares; the program routes
                        liquidity per on-chain rules.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <TransactionHistory wallet={traderPubkey} isTrader={true} />
          </div>

          <div className="space-y-6">
            <Card className="border-primary/20 ring-1 ring-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="size-5 text-chart-3" />
                  Deploy capital
                </CardTitle>
                <CardDescription>
                  Deposit SOL to mirror this trader. You receive vault shares.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Amount (SOL)</span>
                    <span className="text-muted-foreground">Min 0.1</span>
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="tabular-nums"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={submitting}
                  onClick={handleDeposit}
                >
                  {submitting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <>
                      Deposit
                      <ArrowUpRight className="size-4" />
                    </>
                  )}
                </Button>
                <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Info className="size-4 shrink-0 text-primary" />
                  <p>
                    Shares represent your slice of the vault. Withdraw on the
                    investor portal when you want to exit.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="ring-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-primary" />
                  Trust
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <Shield className="size-5 shrink-0 text-foreground/50" />
                  <div>
                    <p className="font-medium text-foreground">Vault security</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      Assets follow the program&apos;s PDA layout—investors
                      redeem via shares.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="size-5 shrink-0 text-foreground/50" />
                  <div>
                    <p className="font-medium text-foreground">Liquidity</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      Redemptions settle against live vault balances and oracle
                      inputs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
