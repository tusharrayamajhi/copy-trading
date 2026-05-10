"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAllTraders } from "../../src/hooks/useTraderQueries";
import { useMyInvestments } from "../../src/hooks/useInvestorQueries";
import { useDeposit } from "../../src/hooks/useDeposit";
import { useWithdraw } from "../../src/hooks/useWithdraw";
import { useWrapSol } from "../../src/hooks/useWrapSol";
import { PublicKey } from "@solana/web3.js";
import {
  Search,
  Wallet,
  TrendingUp,
  BarChart3,
  Activity,
  Vault,
  ArrowDownRight,
  Shield,
  Info,
  RefreshCw,
  Filter,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { TransactionHistory } from "../../src/components/TransactionHistory";
import { useInvestmentLiveStats } from "../../src/hooks/useInvestmentLiveStats";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface VaultTraderAccount {
  commissionPercentage: number;
  lifetimeProfitUsd: { toNumber: () => number };
  lifetimeLossUsd: { toNumber: () => number };
  currentAsset: Record<string, unknown> | undefined;
  traderWallet: { toBase58: () => string };
  name?: string;
  avatarUrl?: string;
}

interface TraderListItem {
  publicKey: string;
  account: VaultTraderAccount;
}

interface LiveStat {
  currentValue: number;
  grossValue: number;
  pnl: number;
  shares: number;
  traderCommissionUsd: number;
  platformFeeUsd: number;
  ownershipPercentage: number;
}

interface InvestmentRecord {
  publicKey: string;
  linkedTraderPubkey: string | { toString: () => string };
  account: {
    initialDepositUsdValue?: { toNumber: () => number };
  };
}

function TraderRow({
  trader,
  index,
  submitting,
  onDeposit,
}: {
  trader: TraderListItem;
  index: number;
  submitting: boolean;
  onDeposit: (wallet: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState<string>("0.1");
  const commission = trader.account.commissionPercentage / 100;
  const profit =
    (trader.account.lifetimeProfitUsd.toNumber() -
      trader.account.lifetimeLossUsd.toNumber()) /
    10 ** 6;
  const currentAsset =
    Object.keys(trader.account.currentAsset || {})[0]?.toLowerCase() === "usdc"
      ? "USDC"
      : "SOL";

  return (
    <TableRow>
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20 overflow-hidden">
            {trader.account.avatarUrl ? (
              <img src={trader.account.avatarUrl} alt={trader.account.name || "Trader"} className="size-full object-cover" />
            ) : (
              <Users className="size-4 text-primary" />
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Link
          href={`/trader/${trader.account.traderWallet.toBase58()}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {trader.account.name || (
            <>
              {trader.account.traderWallet.toBase58().slice(0, 4)}…
              {trader.account.traderWallet.toBase58().slice(-4)}
            </>
          )}
        </Link>
        <p className="text-[10px] text-muted-foreground">Trader</p>
      </TableCell>
      <TableCell className="py-4">
        <div
          className={`flex items-center gap-1.5 text-sm font-medium tabular-nums ${profit > 0.01
              ? "text-chart-2"
              : profit < -0.01
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
        >
          {profit > 0.01 ? (
            <TrendingUp className="size-3" />
          ) : profit < -0.01 ? (
            <ArrowDownRight className="size-3" />
          ) : (
            <Activity className="size-3" />
          )}
          $
          {Math.abs(profit).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </TableCell>
      <TableCell className="py-4 text-sm">{commission}%</TableCell>
      <TableCell className="py-4">
        <Badge variant="outline" className="font-medium">
          {currentAsset}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="relative w-28">
            <Input
              type="number"
              className="h-8 pr-10 text-xs tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              SOL
            </span>
          </div>
          <Button
            size="sm"
            disabled={submitting}
            onClick={() =>
              onDeposit(trader.account.traderWallet.toBase58(), Number(amount))
            }
          >
            Deposit
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function InvestmentRow({
  inv,
  stats,
  trader,
  manualPrice,
  handleWithdraw,
  submitting,
}: {
  inv: InvestmentRecord;
  stats: Record<string, LiveStat>;
  trader: TraderListItem | undefined;
  manualPrice: string;
  handleWithdraw: (investment: InvestmentRecord) => void;
  submitting: boolean;
}) {
  const initialUsd =
    (inv.account.initialDepositUsdValue?.toNumber() ?? 0) / 10 ** 6;
  const currentAsset =
    Object.keys(trader?.account?.currentAsset || {})[0]?.toLowerCase() ===
      "usdc"
      ? "USDC"
      : "SOL";
  const stat = stats[inv.publicKey];
  const solPrice = Number(manualPrice) || 1;
  const netSolReturn = (stat?.currentValue || 0) / solPrice;

  return (
    <TableRow>
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20 overflow-hidden">
            {trader?.account?.avatarUrl ? (
              <img src={trader.account.avatarUrl} alt={trader?.account?.name || "Trader"} className="size-full object-cover" />
            ) : (
              <Vault className="size-4 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">#{inv.publicKey.slice(0, 6)}</p>
            <p className="text-[10px] text-primary">
              {stat?.ownershipPercentage?.toFixed(2)}% ownership
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <p className="text-sm font-medium">
          {trader?.account?.name || (
            <>
              {trader?.account?.traderWallet?.toBase58()?.slice(0, 4)}…
              {trader?.account?.traderWallet?.toBase58()?.slice(-4)}
            </>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground">
          Strategy · {currentAsset}
        </p>
      </TableCell>
      <TableCell className="py-4 tabular-nums text-sm">
        ${initialUsd.toFixed(2)}
        <p className="text-[10px] text-muted-foreground">Cost basis</p>
      </TableCell>
      <TableCell className="py-4">
        <p className="text-sm font-medium tabular-nums">
          ${stat?.grossValue?.toFixed(2) || "0.00"}
        </p>
        <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
          <div className="flex justify-between gap-4">
            <span>Trader fee</span>
            <span className="text-destructive/90">
              -${stat?.traderCommissionUsd?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Platform</span>
            <span className="text-destructive/90">
              -${stat?.platformFeeUsd?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-medium tabular-nums text-primary">
          {netSolReturn.toFixed(4)} SOL
        </span>
        <p className="text-[10px] text-muted-foreground">
          ≈ ${(stat?.currentValue || 0).toFixed(2)} net
        </p>
      </TableCell>
      <TableCell className="py-4 text-right">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleWithdraw(inv)}
          disabled={submitting || !stat || stat.shares <= 0}
        >
          Withdraw
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function InvestorDashboard() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [wsolBalance, setWsolBalance] = useState<number | null>(null);
  const { traders, loading: loadingTraders, refetch: refetchTraders } =
    useAllTraders();
  const { investments, loading: loadingInvestments, refetch: refetchInvestments } =
    useMyInvestments(publicKey, traders);

  const [manualPrice, setManualPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"investments" | "discover">(
    "investments"
  );
  const [search, setSearch] = useState("");

  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { wrap } = useWrapSol();
  const { stats: liveStats } = useInvestmentLiveStats(
    publicKey,
    investments,
    traders,
    Number(manualPrice)
  );

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
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!publicKey || !connection) return;
    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setWalletBalance(bal / 1e9);
        const { getAssociatedTokenAddressSync } = await import(
          "@solana/spl-token"
        );
        const { WSOL_MINT } = await import("../../src/lib/constants");
        const ata = getAssociatedTokenAddressSync(WSOL_MINT, publicKey);
        try {
          const tokenBal = await connection.getTokenAccountBalance(ata);
          setWsolBalance(Number(tokenBal.value.amount) / 1e9);
        } catch {
          setWsolBalance(0);
        }
      } catch {
        console.error("Failed to fetch balances");
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleDeposit = async (traderWallet: string, requestedAmount: number) => {
    try {
      setSubmitting(true);
      const lamports = BigInt(Math.floor(requestedAmount * 1e9));
      const currentWsol = wsolBalance || 0;
      if (currentWsol < requestedAmount) {
        const needed = requestedAmount - currentWsol;
        toast.loading(`Wrapping ${needed.toFixed(3)} SOL…`, { id: "deposit" });
        await wrap(needed);
        await new Promise((r) => setTimeout(r, 2000));
      }
      toast.loading("Depositing to vault…", { id: "deposit" });
      const price = Number(manualPrice);
      if (isNaN(price) || price <= 0) throw new Error("Invalid SOL price");
      await deposit(new PublicKey(traderWallet), lamports, price);
      toast.success("Deposit successful!", { id: "deposit" });
      refetchInvestments();
      refetchTraders();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Deposit failed",
        { id: "deposit" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (investment: InvestmentRecord) => {
    try {
      setSubmitting(true);
      toast.loading("Withdrawing…", { id: "withdraw" });
      const traderPda =
        typeof investment.linkedTraderPubkey === "string"
          ? investment.linkedTraderPubkey
          : investment.linkedTraderPubkey.toString();
      await withdraw(new PublicKey(traderPda), Number(manualPrice));
      toast.success("Withdrawal successful!", { id: "withdraw" });
      refetchInvestments();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Withdrawal failed",
        { id: "withdraw" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <Card className="ring-border/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
              <Wallet className="size-7 text-muted-foreground" />
            </div>
            <CardTitle>Connect wallet</CardTitle>
            <CardDescription>
              Link a wallet to view positions and copy traders on Solana.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredTraders = traders
    .filter(
      (t) =>
        t.publicKey.toLowerCase().includes(search.toLowerCase()) ||
        t.account.traderWallet
          .toBase58()
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const profitA =
        a.account.lifetimeProfitUsd.toNumber() -
        a.account.lifetimeLossUsd.toNumber();
      const profitB =
        b.account.lifetimeProfitUsd.toNumber() -
        b.account.lifetimeLossUsd.toNumber();
      return profitB - profitA;
    });

  const totalPnl = Object.values(liveStats).reduce((acc, s) => acc + s.pnl, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Investor portal
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            <span className="mr-2 inline-block size-2 rounded-full bg-chart-2" />
            {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-6)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Card className="ring-border/60">
            <CardContent className="flex items-center gap-6 px-4 py-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Native SOL
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {walletBalance?.toFixed(3) ?? "—"}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                  Wrapped SOL
                </p>
                <p className="text-lg font-semibold tabular-nums text-primary">
                  {wsolBalance?.toFixed(3) ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="ring-border/60">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wide text-chart-3">
                  Oracle SOL
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  ${manualPrice || "—"}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  refetchInvestments();
                  refetchTraders();
                }}
              >
                <RefreshCw className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <Card className="ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Total allocated</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              $
              {investments
                .reduce(
                  (acc, inv) =>
                    acc + inv.account.initialDepositUsdValue.toNumber() / 1e6,
                  0
                )
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Portfolio value</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-primary">
              $
              {Object.values(liveStats)
                .reduce((acc, s) => acc + s.currentValue, 0)
                .toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Net unrealized P&amp;L</CardDescription>
            <CardTitle
              className={`text-2xl font-semibold tabular-nums ${totalPnl > 0.01
                  ? "text-chart-2"
                  : totalPnl < -0.01
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
            >
              ${totalPnl.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "investments" | "discover")
        }
        className="gap-6"
      >
        <TabsList>
          <TabsTrigger value="investments" className="gap-1.5">
            <Vault className="size-4" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-1.5">
            <Search className="size-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="mt-0">
          <Card className="overflow-hidden ring-border/60">
            <ScrollArea className="max-h-[min(70vh,560px)] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vault</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead>Initial</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>P&amp;L</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInvestments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3 py-8">
                          <Skeleton className="size-8 rounded-full" />
                          <p className="text-sm text-muted-foreground">
                            Loading positions…
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : investments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-8">
                          <Info className="size-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No active investments.
                          </p>
                          <Button
                            variant="link"
                            className="text-primary"
                            onClick={() => setActiveTab("discover")}
                          >
                            Find a trader
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    investments.map((inv) => (
                      <InvestmentRow
                        key={inv.publicKey}
                        inv={inv}
                        stats={liveStats}
                        trader={traders.find(
                          (t) => t.publicKey === inv.linkedTraderPubkey
                        )}
                        manualPrice={manualPrice}
                        handleWithdraw={handleWithdraw}
                        submitting={submitting}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="mt-0">
          <Card className="overflow-hidden ring-border/60">
            <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address…"
                  className="h-9 pl-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="size-4" />
                Sort: lifetime P&amp;L
              </div>
            </CardHeader>
            <ScrollArea className="max-h-[min(70vh,560px)] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead>Lifetime P&amp;L</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Allocate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTraders ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3 py-8">
                          <Skeleton className="size-8 rounded-full" />
                          <p className="text-sm text-muted-foreground">
                            Loading traders…
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTraders.map((trader, index) => (
                      <TraderRow
                        key={trader.publicKey}
                        trader={trader}
                        index={index}
                        submitting={submitting}
                        onDeposit={handleDeposit}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        <Card className="ring-border/60">
          <CardHeader>
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Shield className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Secure PDAs</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Funds sit in program-derived addresses. Traders cannot
                  withdraw your principal—only you burn shares to exit.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="ring-border/60">
          <CardHeader>
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Vault className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Instant exit</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Redeem shares for SOL or USDC based on live vault marks—no
                  arbitrary lock-ups.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-12">
        <TransactionHistory wallet={publicKey} isTrader={false} />
      </div>
    </div>
  );
}
