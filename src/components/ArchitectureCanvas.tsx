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
  Ticket,
  PieChart,
  Globe,
  Activity
} from "lucide-react";

export function ArchitectureCanvas() {
  return (
    <div className="relative w-full rounded-2xl border border-border bg-black/40 p-2 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.035),transparent_70%)]" />

      <div className="relative w-full overflow-x-auto custom-scrollbar md:overflow-visible">
        <svg
          className="mx-auto min-w-[1000px] w-full h-[650px]"
          viewBox="0 0 1000 650"
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

            {/* Motion paths for animated “signals” */}
            <path id="path-trader-to-init" d="M 220 150 C 320 150, 350 80, 420 80" />
            <path id="path-trader-to-swap" d="M 220 150 C 320 150, 350 160, 420 160" />
            <path id="path-investor-to-deposit" d="M 220 350 C 320 350, 350 240, 420 240" />
            <path id="path-swap-to-vault" d="M 580 160 C 650 160, 700 250, 750 250" />
            <path id="path-init-to-vault" d="M 580 80 C 650 80, 700 250, 750 250" />
            <path id="path-deposit-to-vault" d="M 580 240 C 650 240, 700 250, 750 250" />
            <path id="path-vault-to-withdraw" d="M 860 250 C 860 420, 700 420, 580 420" />
            <path id="path-withdraw-to-investor" d="M 420 420 C 320 420, 280 350, 205 350" />
            <path id="path-commission" d="M 420 420 C 80 420, 80 250, 205 175" />
            <path id="path-vault-to-jupiter" d="M 820 220 C 780 220, 740 200, 740 185" />
            <path id="path-jupiter-to-vault" d="M 740 185 C 740 200, 780 250, 820 250" />
            
            {/* New paths for PDA */}
            <path id="path-deposit-to-pda" d="M 500 265 L 500 290" />
            <path id="path-withdraw-to-pda" d="M 500 395 L 500 350" />
            
            {/* New paths for additional components */}
            <path id="path-pyth-to-vault" d="M 750 50 C 750 100, 850 120, 860 150" />
            <path id="path-treasury" d="M 420 420 C 350 420, 300 500, 350 550" />
          </defs>

          {/* Paths */}
          <g>
            {/* Trader to Actions */}
            <motion.path
              d="M 220 150 C 320 150, 350 80, 420 80"
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M 220 150 C 320 150, 350 160, 420 160"
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />

            {/* Investor to Actions */}
            <motion.path
              d="M 220 350 C 320 350, 350 240, 420 240"
              stroke="url(#lineGrad)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.25, 0.75, 0.25] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />

            {/* Actions to Vault */}
            <path d="M 580 80 C 650 80, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 580 160 C 650 160, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 580 240 C 650 240, 700 250, 750 250" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Withdraw Path */}
            <path d="M 860 250 C 860 420, 700 420, 580 420" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 420 420 C 320 420, 280 350, 205 350" stroke="url(#lineGrad)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

            {/* Commission Flow */}
            <path d="M 420 420 C 80 420, 80 250, 205 175" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-yellow-500/20" markerEnd="url(#arrowhead)" />

            {/* PDA Links */}
            <path d="M 500 265 L 500 290" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-chart-2/40" markerEnd="url(#arrowhead)" />
            <path d="M 500 395 L 500 350" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-red-500/40" markerEnd="url(#arrowhead)" />
            <path d="M 420 420 C 350 420, 300 500, 350 550" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-yellow-500/30" markerEnd="url(#arrowhead)" />

            {/* Vault to Jupiter Flow */}
            <path d="M 820 220 C 780 220, 740 200, 740 185" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-primary/30" markerEnd="url(#arrowhead)" />
            <path d="M 740 185 C 740 200, 780 250, 820 250" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-primary/30" markerEnd="url(#arrowhead)" />

            {/* Oracle Link */}
            <path d="M 750 50 C 750 100, 850 120, 860 150" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-blue-500/20" />
          </g>

          {/* Animated “signal dots” */}
          <g className="pointer-events-none" aria-hidden>
            {/* Trader signals */}
            <circle r="3" className="fill-primary/70">
              <animateMotion dur="2.9s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href="#path-trader-to-init" />
              </animateMotion>
            </circle>
            <circle r="3" className="fill-primary/70">
              <animateMotion dur="2.6s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.4s">
                <mpath href="#path-trader-to-swap" />
              </animateMotion>
            </circle>

            {/* Investor capital */}
            <circle r="3" className="fill-chart-2/70">
              <animateMotion dur="3.2s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.2s">
                <mpath href="#path-investor-to-deposit" />
              </animateMotion>
            </circle>

            {/* Actions to vault */}
            <circle r="3" className="fill-primary/60">
              <animateMotion dur="3.1s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.1s">
                <mpath href="#path-init-to-vault" />
              </animateMotion>
            </circle>
            <circle r="3" className="fill-primary/60">
              <animateMotion dur="2.8s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.6s">
                <mpath href="#path-swap-to-vault" />
              </animateMotion>
            </circle>
            <circle r="3" className="fill-chart-2/60">
              <animateMotion dur="3.4s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.9s">
                <mpath href="#path-deposit-to-vault" />
              </animateMotion>
            </circle>

            {/* Withdraw + return path */}
            <circle r="3" className="fill-chart-2/70">
              <animateMotion dur="3.6s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.5s">
                <mpath href="#path-vault-to-withdraw" />
              </animateMotion>
            </circle>
            <circle r="3" className="fill-chart-2/70">
              <animateMotion dur="3.3s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="1.0s">
                <mpath href="#path-withdraw-to-investor" />
              </animateMotion>
            </circle>

            {/* Oracle Price Feed */}
            <circle r="2" className="fill-blue-500/50">
              <animateMotion dur="1.5s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href="#path-pyth-to-vault" />
              </animateMotion>
            </circle>

            {/* Platform Fee */}
            <circle r="2.5" className="fill-yellow-500/60">
              <animateMotion dur="3.5s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="1.0s">
                <mpath href="#path-treasury" />
              </animateMotion>
            </circle>

            {/* Trader Fee (Commission) */}
            <circle r="2.5" className="fill-yellow-500/60">
              <animateMotion dur="4.0s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="2.0s">
                <mpath href="#path-commission" />
              </animateMotion>
            </circle>

            {/* Vault to Jupiter (Execution) */}
            <circle r="2.5" className="fill-primary/55">
              <animateMotion dur="2.4s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="0.3s">
                <mpath href="#path-vault-to-jupiter" />
              </animateMotion>
            </circle>
            <circle r="2.5" className="fill-primary/55">
              <animateMotion dur="2.4s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline" begin="1.5s">
                <mpath href="#path-jupiter-to-vault" />
              </animateMotion>
            </circle>

            {/* PDA Lifecycle */}
            <circle r="2" className="fill-chart-2/50">
              <animateMotion dur="2.5s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href="#path-deposit-to-pda" />
              </animateMotion>
            </circle>
            <circle r="2" className="fill-red-500/50">
              <animateMotion dur="2.5s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href="#path-withdraw-to-pda" />
              </animateMotion>
            </circle>
          </g>

          {/* Text Labels */}
          <g className="text-[10px] font-medium uppercase tracking-widest fill-muted-foreground/50">
            <text x="260" y="135">Signals</text>
            <text x="260" y="335">Capital</text>
            <text x="250" y="445">Net Capital</text>
            <text x="350" y="510">Fees</text>
            
            {/* PDA Labels */}
            <text x="510" y="280" className="text-[7px] fill-chart-2/60">Create PDA Record</text>
            <text x="510" y="380" className="text-[7px] fill-red-500/60">Destroy PDA Record</text>
          </g>

          {/* Nodes */}

          {/* Explanatory Corner Notes */}
          {/* Top Left: Signals */}
          <foreignObject x="30" y="30" width="220" height="100">
            <div className="space-y-1.5 opacity-60">
              <h4 className="text-[10px] font-bold text-primary tracking-widest uppercase">Signal Mirroring</h4>
              <ul className="space-y-1 text-[8px] text-muted-foreground list-none">
                <li className="flex gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Traders deploy strategies on-chain</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Signals mirrored to vault in real-time</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-primary">•</span>
                  <span>Performance tracked by unique PDAs</span>
                </li>
              </ul>
            </div>
          </foreignObject>

          {/* Top Right: Infrastructure */}
          <foreignObject x="750" y="30" width="220" height="100">
            <div className="space-y-1.5 opacity-60 text-right">
              <h4 className="text-[10px] font-bold text-primary tracking-widest uppercase">Infrastructure</h4>
              <ul className="space-y-1 text-[8px] text-muted-foreground list-none">
                <li className="flex gap-1.5 justify-end">
                  <span>Pyth Oracle for real-time SOL price</span>
                  <span className="text-primary">•</span>
                </li>
                <li className="flex gap-1.5 justify-end">
                  <span>Jupiter DEX for low-slippage swaps</span>
                  <span className="text-primary">•</span>
                </li>
                <li className="flex gap-1.5 justify-end">
                  <span>Atomic execution via CPI calls</span>
                  <span className="text-primary">•</span>
                </li>
              </ul>
            </div>
          </foreignObject>

          {/* Bottom Left: Rewards */}
          <foreignObject x="30" y="470" width="220" height="100">
            <div className="space-y-1.5 opacity-60">
              <h4 className="text-[10px] font-bold text-yellow-500 tracking-widest uppercase">Yield & Rewards</h4>
              <ul className="space-y-1 text-[8px] text-muted-foreground list-none">
                <li className="flex gap-1.5">
                  <span className="text-yellow-500">•</span>
                  <span>Performance-based trader commission</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-yellow-500">•</span>
                  <span>Automated platform fee collection</span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-yellow-500">•</span>
                  <span>Net returns distributed on withdraw</span>
                </li>
              </ul>
            </div>
          </foreignObject>

          {/* Bottom Right: Safety */}
          <foreignObject x="750" y="470" width="220" height="100">
            <div className="space-y-1.5 opacity-60 text-right">
              <h4 className="text-[10px] font-bold text-chart-2 tracking-widest uppercase">Non-Custodial Safety</h4>
              <ul className="space-y-1 text-[8px] text-muted-foreground list-none">
                <li className="flex gap-1.5 justify-end">
                  <span>Assets isolated in individual PDAs</span>
                  <span className="text-chart-2">•</span>
                </li>
                <li className="flex gap-1.5 justify-end">
                  <span>Investor retains full withdrawal key</span>
                  <span className="text-chart-2">•</span>
                </li>
                <li className="flex gap-1.5 justify-end">
                  <span>Code-enforced profit sharing math</span>
                  <span className="text-chart-2">•</span>
                </li>
              </ul>
            </div>
          </foreignObject>

          {/* Trader */}
          <foreignObject x="130" y="100" width="150" height="150">
            <div className="flex flex-col items-center justify-center h-full">
              <Node label="Trader" color="primary" icon={<User className="size-6" />} />
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-yellow-500/80">
                <Coins className="size-2.5" />
                Fee
              </div>
            </div>
          </foreignObject>

          {/* Investor */}
          <foreignObject x="130" y="300" width="150" height="150">
            <div className="flex flex-col items-center justify-center h-full">
              <Node label="Investor" color="chart-2" icon={<Users className="size-6" />} />
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-chart-2/20 bg-chart-2/10 px-2 py-0.5 text-[9px] font-bold uppercase text-chart-2/80">
                <Ticket className="size-2.5" />
                Shares
              </div>
            </div>
          </foreignObject>

          {/* Actions */}
          <foreignObject x="420" y="55" width="160" height="65">
            <ActionBox icon={<Vault className="size-3.5 text-primary" />} text="Initialize" details={["comm_pct: 10-20%"]} />
          </foreignObject>
          <foreignObject x="420" y="130" width="160" height="75">
            <ActionBox 
              icon={<ArrowRightLeft className="size-3.5 text-primary" />} 
              text="Swap" 
              details={["target_asset", "amount_in"]} 
            />
          </foreignObject>
          <foreignObject x="420" y="215" width="160" height="65">
            <ActionBox icon={<ArrowDownCircle className="size-3.5 text-chart-2" />} text="Deposit" details={["amount"]} />
          </foreignObject>
          <foreignObject x="420" y="405" width="160" height="65">
            <ActionBox icon={<ArrowUpCircle className="size-3.5 text-chart-2" />} text="Withdraw" details={["investor_shares"]} />
          </foreignObject>

          {/* Investor Account PDA */}
          <foreignObject x="420" y="290" width="160" height="70">
            <div className="flex flex-col items-center justify-center rounded-xl border border-chart-2/30 bg-chart-2/5 p-2 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="size-3 text-chart-2" />
                <span className="text-[8px] font-extrabold uppercase tracking-tighter text-chart-2">Investor PDA</span>
              </div>
              <div className="space-y-0.5 text-center">
                <p className="text-[7px] text-white/40 leading-none">initial_deposit_usd</p>
                <p className="text-[7px] text-white/40 leading-none">shares_balance</p>
                <p className="text-[7px] text-white/40 leading-none">position_state: Active</p>
              </div>
            </div>
          </foreignObject>

          {/* Jupiter DEX */}
          <foreignObject x="680" y="135" width="120" height="50">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 backdrop-blur-sm">
              <Zap className="size-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Jupiter</span>
            </div>
          </foreignObject>

          {/* Pyth Oracle */}
          <foreignObject x="650" y="10" width="120" height="40">
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-center backdrop-blur-sm">
              <Activity className="size-3 text-blue-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400/80">Pyth Oracle</span>
            </div>
          </foreignObject>

          {/* Vault PDA */}
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
                <h3 className="text-xs font-bold tracking-tight text-foreground uppercase mb-1">
                  Non-Custodial
                </h3>
                <p className="text-[10px] font-bold text-primary mb-3">
                  Vault PDA
                </p>
                <div className="space-y-1 border-t border-primary/20 pt-3 text-left">
                  <div className="flex justify-between gap-4">
                    <span className="text-[7px] text-white/40 uppercase">Asset</span>
                    <span className="text-[7px] font-bold text-primary uppercase">SOL / USDC</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[7px] text-white/40 uppercase">Comm %</span>
                    <span className="text-[7px] font-bold text-primary">10-20%</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[7px] text-white/40 uppercase">TVL USD</span>
                    <span className="text-[7px] font-bold text-primary">On-Chain</span>
                  </div>
                </div>
              </div>
            </div>
          </foreignObject>

          {/* Platform Wallet */}
          <foreignObject x="280" y="550" width="140" height="50">
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1.5">
              <Globe className="size-3 text-yellow-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-500/80">Platform Fee</span>
            </div>
          </foreignObject>

        </svg>
      </div>
    </div>
  );
}

function Node({ label, color, icon }: { label: string; color: string; icon: React.ReactNode }) {
  const colorClass = color === "primary" ? "border-primary/40 bg-primary/10 text-primary" : "border-chart-2/40 bg-chart-2/10 text-chart-2";
  const shadowClass = color === "primary" ? "shadow-[0_0_18px_rgba(126,217,87,0.14)]" : "shadow-[0_0_15px_rgba(16,185,129,0.1)]";

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`flex size-14 items-center justify-center rounded-full border-2 ${colorClass} ${shadowClass}`}
        initial={false}
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function ActionBox({ icon, text, details }: { icon: React.ReactNode; text: string; details?: string[] }) {
  return (
    <div className="w-full rounded-xl border border-border bg-muted/40 p-2 text-center backdrop-blur-sm transition-colors hover:border-primary/30">
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight">
        {icon}
        {text}
      </div>
      {details && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-x-2 border-t border-border/40 pt-1.5">
          {details.map((detail, i) => (
            <span key={i} className="text-[7px] text-muted-foreground/60 font-mono">
              {detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

