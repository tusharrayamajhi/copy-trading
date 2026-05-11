"use client";

import { motion } from "framer-motion";
import {
  User,
  Users,
  Vault,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  ShieldCheck,
  Zap,
  Ticket
} from "lucide-react";

export function ArchitectureCanvas() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="relative w-full rounded-2xl border border-border bg-black/40 p-2 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.03),transparent_70%)]" />

      <div className="relative w-full overflow-x-auto custom-scrollbar md:overflow-visible">
        <svg
          className="mx-auto min-w-[1000px] w-full h-[550px]"
          viewBox="0 0 1000 550"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground/40" />
            </marker>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Paths */}
          <g>
            {/* Trader to Actions */}
            <path d="M 220 150 C 320 150, 350 80, 420 80" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 220 150 C 320 150, 350 160, 420 160" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Investor to Actions */}
            <path d="M 220 350 C 320 350, 350 240, 420 240" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Actions to Vault */}
            <path d="M 580 80 C 650 80, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 580 160 C 650 160, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 580 240 C 650 240, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Withdraw Path */}
            <path d="M 800 320 C 800 420, 650 420, 580 420" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 420 420 C 300 420, 250 350, 220 350" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Commission Flow */}
            <path d="M 420 420 C 100 420, 50 250, 120 180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-yellow-500/20" markerEnd="url(#arrowhead)" />

            {/* DEX Link */}
            <path d="M 580 160 L 680 160" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-primary/20" markerEnd="url(#arrowhead)" />
          </g>

          {/* Text Labels */}
          <g className="text-[10px] font-medium uppercase tracking-[0.1em] fill-muted-foreground/50">
            <text x="260" y="135">Signals</text>
            <text x="260" y="335">Capital</text>
            <text x="650" y="210">Sync</text>
            <text x="620" y="445">Net Return</text>
          </g>

          {/* Nodes via ForeignObject */}

          {/* Trader */}
          <foreignObject x="50" y="100" width="150" height="150">
            <div className="flex flex-col items-center justify-center h-full">
              <Node label="Trader" color="primary" icon={<User className="size-6" />} />
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-yellow-500/80">
                <Coins className="size-2.5" />
                Fee
              </div>
            </div>
          </foreignObject>

          {/* Investor */}
          <foreignObject x="50" y="300" width="150" height="150">
            <div className="flex flex-col items-center justify-center h-full">
              <Node label="Investor" color="chart-2" icon={<Users className="size-6" />} />
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-chart-2/20 bg-chart-2/10 px-2 py-0.5 text-[9px] font-bold uppercase text-chart-2/80">
                <Ticket className="size-2.5" />
                Shares
              </div>
            </div>
          </foreignObject>

          {/* Actions */}
          <foreignObject x="420" y="55" width="160" height="50">
            <ActionBox icon={<Vault className="size-3.5 text-primary" />} text="Initialize" />
          </foreignObject>
          <foreignObject x="420" y="135" width="160" height="50">
            <ActionBox icon={<ArrowRightLeft className="size-3.5 text-primary" />} text="Swap" />
          </foreignObject>
          <foreignObject x="420" y="215" width="160" height="50">
            <ActionBox icon={<ArrowDownCircle className="size-3.5 text-chart-2" />} text="Deposit" />
          </foreignObject>
          <foreignObject x="420" y="395" width="160" height="50">
            <ActionBox icon={<ArrowUpCircle className="size-3.5 text-chart-2" />} text="Withdraw" />
          </foreignObject>

          {/* DEX */}
          <foreignObject x="680" y="135" width="120" height="50">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 backdrop-blur-sm">
              <Zap className="size-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Jupiter</span>
            </div>
          </foreignObject>

          {/* Vault */}
          <foreignObject x="750" y="150" width="220" height="200">
            <div className="flex flex-col items-center justify-center h-full p-4">
              <div className="group relative rounded-2xl border-2 border-primary/50 bg-primary/5 p-5 text-center ring-4 ring-primary/5 min-w-[150px]">
                <div className="absolute -right-1.5 -top-1.5 rounded-full bg-chart-2 p-1 shadow-lg">
                  <ShieldCheck className="size-3.5 text-white" />
                </div>
                <div className="mb-2 flex justify-center">
                  <div className="rounded-xl bg-primary/20 p-2.5">
                    <Vault className="size-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xs font-bold tracking-tight text-foreground uppercase">
                  Non-Custodial
                </h3>
                <p className="text-[10px] font-bold text-primary">
                  Vault PDA
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                <div className="size-1 rounded-full bg-chart-2" />
                Shared Pool
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  );
}

function Node({ label, color, icon }: { label: string; color: string; icon: React.ReactNode }) {
  const colorClass = color === "primary" ? "border-primary/40 bg-primary/10 text-primary" : "border-chart-2/40 bg-chart-2/10 text-chart-2";
  const shadowClass = color === "primary" ? "shadow-[0_0_15px_rgba(139,92,246,0.1)]" : "shadow-[0_0_15px_rgba(16,185,129,0.1)]";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex size-14 items-center justify-center rounded-full border-2 transition-all ${colorClass} ${shadowClass}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function ActionBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="w-full rounded-xl border border-border bg-muted/40 p-2 text-center backdrop-blur-sm transition-colors hover:border-primary/30">
      <div className="flex items-center justify-center gap-2 text-[10px] font-medium">
        {icon}
        {text}
      </div>
    </div>
  );
}
