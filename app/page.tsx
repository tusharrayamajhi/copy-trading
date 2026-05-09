"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Globe,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  PieChart,
  MousePointer2,
  Check,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Transparency",
    description:
      "Every signal, swap, and distribution is visible on-chain via secure PDAs.",
    icon: Globe,
  },
  {
    title: "Speed",
    description:
      "Mirror trades with Solana throughput—low latency, high clarity.",
    icon: Cpu,
  },
  {
    title: "Control",
    description:
      "Investors keep custody. Exit when you want without arbitrary lock-ups.",
    icon: MousePointer2,
  },
  {
    title: "Analytics",
    description:
      "Live P&L context with oracle-backed pricing for a data-first dashboard.",
    icon: PieChart,
  },
] as const;

const flow = [
  {
    step: "01",
    role: "Investor",
    detail:
      "PDA record, mirrored execution, share ownership, exit anytime.",
  },
  {
    step: "02",
    role: "Vault PDA",
    detail:
      "Token storage, shared portfolio, pricing inputs, routed swaps.",
  },
  {
    step: "03",
    role: "Trader",
    detail:
      "Strategy and signals, performance fee—no direct investor fund access.",
  },
] as const;

const transparencyFeature = features[0];
const TransparencyFeatureIcon = transparencyFeature.icon;
const secondaryFeatures = features.slice(1);

const heroChecks = [
  "Self-custodial vault shares",
  "Oracle-aware execution context",
  "Built for Solana mainnet workflows",
] as const;

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

function MotionBlock({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-40px" }}
      variants={fade}
      custom={index}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient: single soft wash + grid (Vercel-adjacent, still minimal) */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-18%,rgba(139,92,246,0.09),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative">
        <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-24">
            <div className="space-y-10">
              <motion.div
                className="space-y-6"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="rounded-md px-3 py-1 font-normal"
                  >
                    CopyCatt
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Non-custodial · Solana
                  </span>
                </div>

                <div className="space-y-5">
                  <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                    Copy trading
                    <span className="text-muted-foreground"> without </span>
                    <span className="text-primary">the noise</span>
                  </h1>
                  <p className="max-w-[34rem] text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
                    A calm, data-forward terminal for following signal providers
                    on-chain—clear roles, explicit risk, and custody that never
                    leaves your keys.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    nativeButton={false}
                    render={<Link href="/investor" />}
                    size="lg"
                    className="h-10 px-5"
                  >
                    Investor portal
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    render={<Link href="/trader" />}
                    className="h-10 px-5"
                  >
                    Trader portal
                  </Button>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {heroChecks.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Check className="size-3" strokeWidth={2.5} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-8">
                  {[
                    { label: "Network", value: "Solana" },
                    { label: "Pricing", value: "Pyth" },
                    { label: "Liquidity", value: "Jupiter" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="overflow-hidden shadow-none ring-1 ring-border/90">
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#EF4444]/80" />
                    <span className="size-2.5 rounded-full bg-[#F59E0B]/80" />
                    <span className="size-2.5 rounded-full bg-[#10B981]/80" />
                    <span className="ml-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      Execution panel
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="size-4 text-primary" />
                      Live feed
                    </CardTitle>
                    <Badge variant="outline" className="font-normal text-chart-2">
                      <span className="mr-1.5 size-1.5 rounded-full bg-chart-2" />
                      Synced
                    </Badge>
                  </div>
                  <CardDescription>Illustrative terminal view</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="flex items-end justify-between gap-2 rounded-lg border border-border/70 bg-background/50 px-3 py-3">
                    <div className="flex h-14 flex-1 items-end justify-between gap-0.5">
                      {[40, 65, 35, 80, 55, 90, 48, 72, 44, 68, 52, 85].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="w-full max-w-[6px] rounded-sm bg-primary/25"
                            style={{ height: `${h}%`, minHeight: "10px" }}
                          />
                        )
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      SOL·USDC
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Signal</span>
                    <span className="font-mono text-foreground">SOL / USDC</span>
                  </div>
                  <Separator />
                  {[
                    { label: "Trader", value: "+2.4% ROI" },
                    { label: "Vault shares", value: "Mint ok" },
                    { label: "Latency", value: "48 ms" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-md bg-background ring-1 ring-border">
                          <Activity className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {row.label}
                          </p>
                          <p className="font-mono text-sm font-medium tabular-nums">
                            {row.value}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-border bg-muted/15 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Illustrative TVL
                    </p>
                    <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                      $1,245,200
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-chart-2">
                      24h
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums text-chart-2">
                      +12.5%
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border bg-card/25 py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <MotionBlock className="mb-14 max-w-2xl space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Why CopyCatt
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Protocol pillars
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Minimal surface area, maximal clarity—built for people who treat
                crypto like infrastructure, not a casino.
              </p>
            </MotionBlock>

            <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
              <MotionBlock
                className="space-y-5 lg:col-span-4"
                index={0}
              >
                <Card className="h-full border-border/80 bg-background/40 ring-1 ring-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Design goals</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Non-custodial roles, on-chain accounting, and UI that gets
                      out of the way of the numbers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {[
                      { icon: ShieldCheck, text: "Non-custodial by design" },
                      { icon: Zap, text: "Signal-driven execution" },
                      { icon: BarChart3, text: "Performance-aligned fees" },
                    ].map(({ icon: Icon, text }) => (
                      <div
                        key={text}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground"
                      >
                        <Icon className="size-4 shrink-0 text-primary" />
                        {text}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </MotionBlock>

              <div className="grid gap-4 lg:col-span-8 lg:grid-cols-3 lg:grid-rows-2">
                <MotionBlock
                  className="lg:col-span-1 lg:row-span-2"
                  index={1}
                >
                  <Card className="h-full ring-1 ring-border/70">
                    <CardHeader className="pb-3">
                      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                        <TransparencyFeatureIcon className="size-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        {transparencyFeature.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {transparencyFeature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </MotionBlock>
                {secondaryFeatures.map((f, i) => (
                  <MotionBlock
                    key={f.title}
                    className={cn(
                      i === 2 && "lg:col-span-2"
                    )}
                    index={i + 2}
                  >
                    <Card className="h-full ring-1 ring-border/70">
                      <CardHeader>
                        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                          <f.icon className="size-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{f.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {f.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </MotionBlock>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <MotionBlock className="mb-14 max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Flow
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Architecture
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Capital and signals move through PDAs—investors retain shares; the
              vault holds assets; traders publish signals without taking
              custody.
            </p>
          </MotionBlock>

          <div className="grid gap-6 md:grid-cols-3">
            {flow.map((step, i) => (
              <MotionBlock key={step.role} index={i}>
                <div className="relative h-full">
                  {i < flow.length - 1 ? (
                    <div
                      className="absolute top-10 left-[calc(50%+3.5rem)] hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-border to-transparent md:block"
                      aria-hidden
                    />
                  ) : null}
                  <Card className="relative h-full overflow-hidden ring-1 ring-border/70">
                    <div className="absolute right-4 top-4 font-mono text-[10px] tabular-nums text-muted-foreground/70">
                      {step.step}
                    </div>
                    <CardHeader className="pt-8">
                      <Badge variant="secondary" className="w-fit font-medium">
                        {step.role}
                      </Badge>
                      <CardDescription className="pt-3 text-sm leading-relaxed">
                        {step.detail}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </MotionBlock>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-28">
          <MotionBlock>
            <Card className="overflow-hidden ring-1 ring-border/80">
              <CardContent className="grid gap-12 p-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-12">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-primary">
                      Get started
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      Ready when you are
                    </h2>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                      Open the investor portal to allocate, or the trader portal
                      to run a vault—same program, two clear paths.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 border-y border-border py-8">
                    {[
                      { label: "Traders", value: "120+", tone: "foreground" },
                      { label: "Signals", value: "8,450", tone: "primary" },
                      { label: "Investors", value: "1.2K", tone: "foreground" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {s.label}
                        </p>
                        <p
                          className={cn(
                            "mt-1 font-mono text-2xl font-semibold tabular-nums",
                            s.tone === "primary" && "text-primary"
                          )}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      nativeButton={false}
                      render={<Link href="/investor" />}
                      className="h-10"
                    >
                      Start copying
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href="/trader" />}
                      className="h-10"
                    >
                      Lead a vault
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/20 p-6 lg:p-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    At a glance
                  </p>
                  <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-medium text-foreground">
                          Investors
                        </span>{" "}
                        deposit to a vault and hold redeemable shares—not a
                        blank check to a wallet.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-medium text-foreground">
                          Traders
                        </span>{" "}
                        rotate strategy and earn fees defined on-chain—no
                        off-platform handshakes.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-medium text-foreground">
                          Everyone
                        </span>{" "}
                        sees the same ledger: fewer surprises, faster decisions.
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </MotionBlock>
        </section>

        <footer className="border-t border-border py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              CopyCatt · Solana · 2026
            </p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/investor" className="hover:text-foreground">
                Investor
              </Link>
              <Link href="/trader" className="hover:text-foreground">
                Trader
              </Link>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
