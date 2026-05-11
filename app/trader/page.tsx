"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { useTraderAccount, usePlatformConfig } from "../../src/hooks/useTraderQueries";
import { useCreateTrader } from "../../src/hooks/useCreateTrader";
import { useSignalSwap } from "../../src/hooks/useSignalSwap";
import { useInitializePlatform } from "../../src/hooks/useInitializePlatform";
import {
  Info,
  RefreshCw,
  BarChart3,
  Zap,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Tag,
  TrendingUp as Bullish,
  TrendingDown as Bearish,
  Users,
  Vault,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TransactionHistory } from "../../src/components/TransactionHistory";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";

export default function TraderDashboard() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [vaultBalances, setVaultBalances] = useState<{ sol: number; usdc: number }>({
    sol: 0,
    usdc: 0,
  });
  const { data: traderAccount, loading, refetch } = useTraderAccount(publicKey);
  const { data: platformConfig, loading: loadingConfig, refetch: refetchConfig } =
    usePlatformConfig();

  const createTrader = useCreateTrader();
  const signalSwap = useSignalSwap();
  const initializePlatform = useInitializePlatform();

  const [submitting, setSubmitting] = useState(false);
  const [commission, setCommission] = useState(10);
  const [manualPrice, setManualPrice] = useState<string>("");
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  useEffect(() => {
    if (!isChartExpanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsChartExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isChartExpanded]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const { getSolPrice } = await import("../../src/lib/price");
        const price = await getSolPrice();
        setManualPrice(price.toFixed(2));
      } catch {
        setManualPrice("145.00");
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setWalletBalance(bal / 1e9);
    } catch {
      console.error("Failed to fetch wallet balance");
    }
  }, [publicKey, connection]);

  const fetchVaultBalances = useCallback(async () => {
    if (!traderAccount || !connection) return;
    try {
      const solBal = await connection.getTokenAccountBalance(
        traderAccount.traderVaultTokenSol
      );
      const usdcBal = await connection.getTokenAccountBalance(
        traderAccount.traderVaultTokenUsdc
      );
      setVaultBalances({
        sol: Number(solBal.value.amount) / 1e9,
        usdc: Number(usdcBal.value.amount) / 1e6,
      });
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message?.includes("could not find account")
      ) {
        setVaultBalances({ sol: 0, usdc: 0 });
      }
    }
  }, [traderAccount, connection]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchBalance();
    }, 0);
    const interval = window.setInterval(() => {
      void fetchBalance();
    }, 30000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [fetchBalance]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchVaultBalances();
    }, 0);
    const interval = window.setInterval(() => {
      void fetchVaultBalances();
    }, 30000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [fetchVaultBalances]);

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <Card className="ring-border/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <CardTitle>Connect wallet</CardTitle>
            <CardDescription>
              Sign in to manage your trader profile and signals.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateProfile = async () => {
    try {
      setSubmitting(true);
      await createTrader(commission * 100);
      toast.success("Trader profile created.");
      refetch();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create profile"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async (asset: "Sol" | "Usdc") => {
    try {
      setSubmitting(true);
      await signalSwap(asset);
      toast.success(`Strategy set to ${asset === "Sol" ? "SOL" : "USDC"}.`);
      refetch();
      fetchVaultBalances();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingConfig) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!platformConfig) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <Alert className="border-border ring-1 ring-border/60">
          <AlertTitle>Platform not initialized</AlertTitle>
          <AlertDescription className="mt-2">
            Initialize the program config on this cluster before creating traders.
          </AlertDescription>
          <Button className="mt-4" onClick={() => initializePlatform()}>
            Initialize platform
          </Button>
        </Alert>
      </div>
    );
  }

  if (!traderAccount) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <Card className="ring-border/80">
          <CardHeader>
            <CardTitle>Set up trader</CardTitle>
            <CardDescription>
              Choose a performance fee. You can adjust strategy after the vault
              is live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Commission (%)
              </label>
              <Input
                type="number"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
              />
            </div>
            <Button
              className="w-full"
              disabled={submitting}
              onClick={handleCreateProfile}
            >
              Create vault
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAsset =
    Object.keys(traderAccount.currentAsset || {})[0]?.toLowerCase() === "usdc"
      ? "USDC"
      : "SOL";
  const realizedProfit = traderAccount.lifetimeProfitUsd.toNumber() / 1e6;
  const realizedLoss = traderAccount.lifetimeLossUsd.toNumber() / 1e6;
  const netRealized = realizedProfit - realizedLoss;
  const livePrice = Number(manualPrice) || 0;
  const liveVaultValueUsd = vaultBalances.sol * livePrice + vaultBalances.usdc;
  const initialVaultValueUsd = traderAccount.totalSharesValueUsd.toNumber() / 1e6;
  // Trading PnL: difference from strategy swaps (realized, on-chain)
  const tradingPnlUsd = netRealized;
  const tradingPnlSol = livePrice > 0 ? tradingPnlUsd / livePrice : 0;
  // Unrealized PnL: live vault value vs cost basis (includes SOL price movement)
  const unrealizedPnl =
    initialVaultValueUsd > 0.01 ? liveVaultValueUsd - initialVaultValueUsd : 0;
  const unrealizedPnlSol = livePrice > 0 ? unrealizedPnl / livePrice : 0;
  const pnlPercent =
    initialVaultValueUsd > 0.01 ? (unrealizedPnl / initialVaultValueUsd) * 100 : 0;
  // Market movement component = unrealized - trading (i.e. from SOL price change)
  const marketMovementUsd = unrealizedPnl - tradingPnlUsd;
  const marketMovementSol = livePrice > 0 ? marketMovementUsd / livePrice : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Trader command
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {publicKey.toBase58().slice(0, 8)}…
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Card className="ring-border/60">
            <CardContent className="flex items-center gap-6 px-4 py-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Oracle
                </p>
                <p className="text-lg font-semibold tabular-nums text-primary">
                  ${manualPrice || "—"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Wallet
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {walletBalance?.toFixed(3) ?? "—"} SOL
                </p>
              </div>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/trader/settings")}
          >
            <Settings className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetch();
              refetchConfig();
              fetchVaultBalances();
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="ring-border/60">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-4 text-chart-3" />
                Strategy swap
              </CardTitle>
              <Badge variant="secondary">{currentAsset} exposure</Badge>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
                <button
                  type="button"
                  onClick={() => setIsChartExpanded(true)}
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
                  aria-label="Expand chart"
                >
                  <Maximize2 className="size-4" />
                  Expand
                </button>
                <iframe
                  title="SOL/USD chart"
                  src="https://s.tradingview.com/widgetembed/?symbol=COINBASE%3ASOLUSD&interval=60&theme=dark&style=1&timezone=Etc%2FUTC&locale=en"
                  className="size-full border-0"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto justify-between gap-4 py-4"
                  disabled={submitting || currentAsset === "SOL"}
                  onClick={() => handleSwap("Sol")}
                >
                  <span className="text-left">
                    <span className="flex items-center gap-2 font-medium">
                      Buy SOL <Bullish className="size-4 text-chart-2" />
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Rotate vault to SOL
                    </span>
                  </span>
                  <ShoppingCart className="size-5 shrink-0" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-between gap-4 py-4"
                  disabled={submitting || currentAsset === "USDC"}
                  onClick={() => handleSwap("Usdc")}
                >
                  <span className="text-left">
                    <span className="flex items-center gap-2 font-medium">
                      Sell to USDC <Bearish className="size-4 text-destructive" />
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Rotate vault to USDC
                    </span>
                  </span>
                  <Tag className="size-5 shrink-0" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {isChartExpanded && (
            <div
              className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="Expanded chart"
              onClick={() => setIsChartExpanded(false)}
            >
              <div
                className="absolute inset-4 overflow-hidden rounded-2xl border border-border bg-background/90 shadow-2xl md:inset-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="size-4 text-primary" />
                      SOL / USD
                  </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting || currentAsset === "SOL"}
                        onClick={() => handleSwap("Sol")}
                        className="gap-2"
                      >
                        <ShoppingCart className="size-4" />
                        Buy SOL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting || currentAsset === "USDC"}
                        onClick={() => handleSwap("Usdc")}
                        className="gap-2"
                      >
                        <Tag className="size-4" />
                        Sell to USDC
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChartExpanded(false)}
                        className="gap-2"
                      >
                        <Minimize2 className="size-4" />
                        Collapse
                      </Button>
                    </div>
                </div>
                <div className="h-[calc(100%-49px)]">
                  <iframe
                    title="SOL/USD chart expanded"
                    src="https://s.tradingview.com/widgetembed/?symbol=COINBASE%3ASOLUSD&interval=60&theme=dark&style=1&timezone=Etc%2FUTC&locale=en"
                    className="size-full border-0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Unrealized PnL Card — SOL primary */}
            <Card className="ring-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Unrealized P&amp;L</CardDescription>
                  <Badge variant="outline" className="tabular-nums text-xs">
                    {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                  </Badge>
                </div>
                {/* SOL — primary denomination */}
                <CardTitle
                  className={`text-3xl font-semibold tabular-nums ${unrealizedPnlSol >= 0 ? "text-chart-2" : "text-destructive"}`}
                >
                  {unrealizedPnlSol >= 0 ? "+" : ""}{unrealizedPnlSol.toFixed(4)} SOL
                </CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ≈ {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)} USD
                </p>
              </CardHeader>
              <CardContent className="space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mark value</span>
                  <span className="font-medium tabular-nums">
                    {(liveVaultValueUsd / (livePrice || 1)).toFixed(4)} SOL
                    <span className="ml-1 text-muted-foreground">≈ ${liveVaultValueUsd.toFixed(2)}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost basis</span>
                  <span className="tabular-nums text-muted-foreground">
                    {(initialVaultValueUsd / (livePrice || 1)).toFixed(4)} SOL
                    <span className="ml-1">≈ ${initialVaultValueUsd.toFixed(2)}</span>
                  </span>
                </div>
                <div className="mt-2 rounded-md bg-muted/40 p-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">↳ Trading strategy</span>
                    <span className={`tabular-nums font-medium ${tradingPnlSol >= 0 ? "text-chart-2" : "text-destructive"}`}>
                      {tradingPnlSol >= 0 ? "+" : ""}{tradingPnlSol.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">↳ SOL price move</span>
                    <span className={`tabular-nums ${marketMovementSol >= 0 ? "text-chart-3" : "text-muted-foreground"}`}>
                      {marketMovementSol >= 0 ? "+" : ""}{marketMovementSol.toFixed(4)} SOL
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lifetime Realized Card — SOL primary */}
            <Card className="ring-border/60">
              <CardHeader className="pb-2">
                <CardDescription>Lifetime realized (trading only)</CardDescription>
                <CardTitle
                  className={`text-3xl font-semibold tabular-nums ${tradingPnlSol >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {tradingPnlSol >= 0 ? "+" : ""}{tradingPnlSol.toFixed(4)} SOL
                </CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ≈ {netRealized >= 0 ? "+" : ""}${netRealized.toFixed(2)} USD
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-chart-2">
                    Profits
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {(realizedProfit / (livePrice || 1)).toFixed(4)}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">SOL</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">≈ ${realizedProfit.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-destructive">
                    Losses
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {(realizedLoss / (livePrice || 1)).toFixed(4)}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">SOL</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">≈ ${realizedLoss.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="ring-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Vault className="size-4 text-primary" />
                Vault
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Management fee</span>
                <span className="font-medium tabular-nums">
                  {traderAccount.commissionPercentage / 100}%
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">SOL</span>
                <span className="font-medium tabular-nums">
                  {vaultBalances.sol.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">USDC</span>
                <span className="font-medium tabular-nums">
                  ${vaultBalances.usdc.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="ring-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <CardTitle className="text-sm">Mark methodology</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Live P&amp;L uses SOL × oracle plus USDC, minus principal basis
                recorded on-chain.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="ring-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Token accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-[10px] text-muted-foreground">
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-foreground/70">SOL vault</p>
                <p className="truncate">{traderAccount.traderVaultTokenSol?.toBase58()}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-foreground/70">USDC vault</p>
                <p className="truncate">{traderAccount.traderVaultTokenUsdc?.toBase58()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <TransactionHistory wallet={publicKey} />
      </div>
    </div>
  );
}
