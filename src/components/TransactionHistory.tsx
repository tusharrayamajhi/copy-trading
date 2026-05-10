import { useState, useEffect } from "react";
import { useTransactionHistory } from "../hooks/useTransactionHistory";
import { PublicKey } from "@solana/web3.js";
import {
  ExternalLink,
  History,
  ArrowUpRight,
  Coins,
  User,
  TrendingUp,
  ArrowRight,
  Clock,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  wallet: PublicKey;
  isTrader?: boolean;
}

type FilterType = "all" | "deposit" | "swap" | "withdraw";

export function TransactionHistory({
  wallet,
  isTrader = true,
}: TransactionHistoryProps) {
  const { transactions, loading } = useTransactionHistory(wallet, isTrader);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filters: FilterType[] = isTrader 
    ? ["all", "deposit", "swap"] 
    : ["all", "swap", "withdraw"];

  // Reset filter if it's not available in the current view
  useEffect(() => {
    if (!filters.includes(activeFilter)) {
      setActiveFilter("all");
    }
  }, [isTrader, filters, activeFilter]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "deposit") return tx.action === "DepositFunds";
    if (activeFilter === "swap") return tx.action === "SignalSwap";
    if (activeFilter === "withdraw") return tx.action === "WithdrawFunds";
    return true;
  });

  function formatTime(timestamp: number | null) {
    if (!timestamp) return "Pending";
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(timestamp * 1000));
  }

  function formatDate(timestamp: number | null) {
    if (!timestamp) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp * 1000));
  }

  function getActionIcon(action: string) {
    switch (action) {
      case "SignalSwap":
        return <Coins className="size-4" />;
      case "DepositFunds":
        return <ArrowRight className="size-4" />;
      case "WithdrawFunds":
        return <User className="size-4" />;
      case "CreateTrader":
        return <TrendingUp className="size-4" />;
      default:
        return <History className="size-4" />;
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <Card className="ring-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-primary" />
            Activity
          </CardTitle>
          <CardDescription>
            {isTrader ? "Trader executions" : "Your recent transactions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Skeleton className="size-8 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-border/60">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border py-4">
        <div className="flex items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" />
              Platform activity
            </CardTitle>
            <CardDescription className="hidden sm:block">
              {isTrader ? "Trader execution log" : "Investor activity"}
            </CardDescription>
          </div>

          <div className="flex items-center rounded-lg bg-muted/50 p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium transition-all rounded-md capitalize",
                  activeFilter === f 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            nativeButton={false}
            render={
              <a
                href={`https://explorer.solana.com/address/${wallet.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Explorer
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <Clock className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {activeFilter === "all" 
                ? "No recent transactions." 
                : `No ${activeFilter} transactions found.`}
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.signature}
              className="rounded-lg border border-border bg-card/50 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                      tx.status === "success"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {getActionIcon(tx.action)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{tx.action}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(tx.timestamp)} · {formatTime(tx.timestamp)}
                      <span className="ml-2 font-mono text-[10px]">
                        {tx.signature.slice(0, 8)}…
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {tx.status === "failed" && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                  <Button variant="ghost" size="icon-sm" nativeButton={false} render={<a href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" />}>
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              </div>
              {tx.details && Object.keys(tx.details).length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap items-center justify-between gap-6 text-xs w-full">
                    {tx.details.amount != null && (
                      <div className="flex-1 min-w-[90px]">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Amount
                        </p>
                        <p className="mt-0.5 font-medium tabular-nums whitespace-nowrap">
                          {tx.details.amount.toLocaleString()}{" "}
                          <span className="text-primary">{tx.details.asset}</span>
                        </p>
                      </div>
                    )}
                    {tx.details.price != null && (
                      <div className="flex-1 min-w-[90px]">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Oracle
                        </p>
                        <p className="mt-0.5 font-medium tabular-nums whitespace-nowrap">
                          ${tx.details.price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {tx.details.amount != null && tx.details.price != null && (
                      <div className="flex-1 min-w-[90px]">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          USD
                        </p>
                        <p className="mt-0.5 font-medium tabular-nums text-chart-2 whitespace-nowrap">
                          ${(tx.details.asset === "SOL" 
                            ? tx.details.amount * tx.details.price 
                            : tx.details.amount).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {(tx.action === "SignalSwap" && (tx.details as any).toAsset) && (
                       <div className="flex-1 min-w-[90px]">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Target
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 font-medium whitespace-nowrap">
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="text-primary">{(tx.details as any).toAsset}</span>
                        </p>
                      </div>
                    )}
                    {tx.details.pnlUsd !== undefined && tx.details.pnlUsd !== null && tx.details.pnlPercentage !== undefined && tx.details.pnlPercentage !== null && (
                      <div className="flex-1 min-w-[110px]">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Realized P&amp;L
                        </p>
                        <p className={`mt-0.5 font-medium tabular-nums whitespace-nowrap ${tx.details.pnlUsd > 0 ? "text-chart-2" : tx.details.pnlUsd < 0 ? "text-destructive" : ""}`}>
                          {tx.details.pnlUsd > 0 ? "+" : ""}${tx.details.pnlUsd.toFixed(2)}
                          <span className="ml-1 text-[10px] opacity-70">
                            ({tx.details.pnlPercentage > 0 ? "+" : ""}{tx.details.pnlPercentage.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="flex-1 min-w-[80px]">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-medium capitalize whitespace-nowrap">
                        <span
                          className={`size-1.5 rounded-full ${tx.status === "success" ? "bg-chart-2" : "bg-destructive"}`}
                        />
                        {tx.status}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
