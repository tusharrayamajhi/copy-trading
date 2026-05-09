"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    ArrowRight,
    BarChart3,
    ShieldCheck,
    Zap,
    Users,
    Wallet,
    TrendingUp,
    ChevronRight,
    Globe,
    Lock,
    Cpu,
    Target,
    History,
    Activity,
    ArrowUpRight,
    MousePointer2,
    Trophy,
    PieChart,
    RefreshCw,
    CheckCircle2
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

function WorkflowCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        const nodeRadius = 40;

        const resize = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 550; // Increased height for info
            }
        };

        window.addEventListener("resize", resize);
        resize();

        const nodes = [
            {
                id: "investor",
                label: "INVESTOR",
                x: 0.15, y: 0.4,
                color: "#22d3ee",
                info: ["• Personal PDA Record", "• Auto-Mirroring", "• Share Ownership", "• Instant Exit"]
            },
            {
                id: "vault",
                label: "VAULT PDA",
                x: 0.5, y: 0.4,
                color: "#3b82f6",
                info: ["• Actual Token Storage", "• Shared Portfolio", "• Oracle Pricing", "• CPI Swaps"]
            },
            {
                id: "trader",
                label: "TRADER",
                x: 0.85, y: 0.4,
                color: "#a855f7",
                info: ["• Creates Strategy", "• Sends Trade Signals", "• Earns Commission", "• No Fund Access"]
            }
        ];

        const drawNode = (node: any) => {
            const x = node.x * canvas.width;
            const y = node.y * canvas.height;

            // Info Box
            ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.roundRect(x - 60, y + 60, 120, 90, 12);
            ctx.fill();
            ctx.stroke();

            // Text in Info Box
            ctx.fillStyle = node.color;
            ctx.font = "bold 9px Inter, sans-serif";
            ctx.textAlign = "left";
            node.info.forEach((line: string, i: number) => {
                ctx.fillText(line, x - 50, y + 85 + (i * 18));
            });

            // Node Circle
            ctx.shadowBlur = 20;
            ctx.shadowColor = node.color;
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#0f172a";
            ctx.fill();
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = "#fff";
            ctx.font = "bold 10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(node.label, x, y + 5);
        };

        const createParticle = (from: any, to: any, type: "asset" | "signal") => {
            particles.push({
                x: from.x * canvas.width,
                y: from.y * canvas.height,
                targetX: to.x * canvas.width,
                targetY: to.y * canvas.height,
                progress: 0,
                speed: 0.01 + Math.random() * 0.01,
                color: type === "asset" ? "#22d3ee" : "#a855f7",
                size: type === "asset" ? 4 : 3
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Connections
            ctx.beginPath();
            ctx.moveTo(nodes[0].x * canvas.width, nodes[0].y * canvas.height);
            ctx.lineTo(nodes[1].x * canvas.width, nodes[1].y * canvas.height);
            ctx.lineTo(nodes[2].x * canvas.width, nodes[2].y * canvas.height);
            ctx.strokeStyle = "rgba(30, 41, 59, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();

            nodes.forEach(drawNode);

            particles = particles.filter(p => p.progress < 1);
            particles.forEach(p => {
                p.progress += p.speed;
                const currentX = p.x + (p.targetX - p.x) * p.progress;
                const currentY = p.y + (p.targetY - p.y) * p.progress;

                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            if (Math.random() < 0.03) createParticle(nodes[0], nodes[1], "asset");
            if (Math.random() < 0.02) createParticle(nodes[2], nodes[1], "signal");
            if (Math.random() < 0.01) createParticle(nodes[1], nodes[0], "asset");

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-[550px] block" />;
}

export default function Home() {
    const { publicKey } = useWallet();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setActiveTab((prev) => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden selection:bg-cyan-500/30">

            {/* --- BACKGROUND ENGINE --- */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />

                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-cyan-500 rounded-full animate-ping"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${3 + Math.random() * 5}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="fixed inset-0 z-[1] opacity-[0.15] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '48px 48px' }}
            />

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 container mx-auto px-6 pt-16 pb-32 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="text-left space-y-8">
                        <div className="inline-flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-5 py-2.5 rounded-2xl backdrop-blur-xl group">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse group-hover:scale-150 transition-transform" />
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Next-Gen Trading Terminal</span>
                        </div>

                        <h1 className="text-6xl md:text-[5.5rem] font-black leading-[0.85] tracking-tighter italic text-white uppercase">
                            Precision <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                                Copy-Trading.
                            </span>
                        </h1>

                        <p className="max-w-xl text-lg text-slate-400 leading-relaxed font-medium">
                            Join the first non-custodial copy-trading protocol on Solana.
                            <span className="block mt-2 text-slate-500 italic">"Precision Copy-Trading. Effortless Execution. Built on Solana."</span>
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link href="/investor" className="group relative px-8 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                INVESTOR PORTAL <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                            <Link href="/trader" className="group px-8 py-5 bg-slate-900 border-2 border-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:border-cyan-500/50 transition-all flex items-center gap-3">
                                TRADER COMMAND <Zap className="w-5 h-5 text-yellow-400" />
                            </Link>
                        </div>

                        <div className="pt-12 flex items-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                            <span className="text-2xl font-black italic tracking-tighter">SOLANA</span>
                            <span className="text-2xl font-black italic tracking-tighter">PYTH</span>
                            <span className="text-2xl font-black italic tracking-tighter underline underline-offset-8">JUPITER</span>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-[80px] rounded-full group-hover:bg-cyan-500/30 transition-colors"></div>
                        <div className="relative bg-slate-950 border-4 border-slate-800 rounded-[3rem] p-4 shadow-2xl shadow-black/50 overflow-hidden transform group-hover:rotate-1 group-hover:-translate-y-2 transition-all duration-700">
                            <div className="bg-slate-900/80 border-b border-slate-800 p-6 flex justify-between items-center backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-red-500/50 rounded-full"></div>
                                    <div className="w-3 h-3 bg-amber-500/50 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500/50 rounded-full"></div>
                                    <span className="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Live Command Feed</span>
                                </div>
                                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                                    <span className="text-[10px] font-black text-green-400">EXECUTING</span>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 font-mono">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">INIT_SWAP_SIGNAL</span>
                                    <span className="text-cyan-400 font-bold">SOL/USDC</span>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: "TRADER_44dZ", val: "+2.4% ROI", color: "text-green-400" },
                                        { label: "VAULT_SHARES", val: "MINT_SUCCESS", color: "text-blue-400" },
                                        { label: "NETWORK_LTC", val: "48ms", color: "text-slate-400" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                                <Activity className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-black">{item.label}</p>
                                                <p className={`text-sm font-black ${item.color}`}>{item.val}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-700" />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-800">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total TVL Locked</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-white uppercase">$1,245,200</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-green-500 font-black uppercase mb-1">Growth (24H)</p>
                                            <p className="text-xl font-black text-green-400 italic">+12.5%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-[500px] h-[500px] border border-cyan-500/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
                                <div className="w-[300px] h-[300px] border border-blue-500/5 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PROTOCOL PILLARS --- */}
            <section id="features" className="relative z-10 py-32 border-y border-slate-900 bg-slate-950/50 backdrop-blur-3xl overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-1 space-y-6">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Protocol Pillars</h2>
                            <p className="text-slate-500 text-lg leading-relaxed">
                                We orchestrate a non-custodial ecosystem where followers and leaders thrive together through mathematical transparency.
                            </p>
                            <div className="pt-6 space-y-4">
                                <div className="flex items-center gap-4 text-sm font-black italic text-cyan-400 uppercase">
                                    <ShieldCheck className="w-6 h-6" /> 100% Non-Custodial
                                </div>
                                <div className="flex items-center gap-4 text-sm font-black italic text-blue-400 uppercase">
                                    <Zap className="w-6 h-6" /> Zero-Slippage Signals
                                </div>
                                <div className="flex items-center gap-4 text-sm font-black italic text-purple-400 uppercase">
                                    <Trophy className="w-6 h-6" /> Performance-Based Rewards
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[
                                { title: "Transparency", desc: "Every signal, swap, and profit distribution is visible on-chain via our secure PDAs.", icon: Globe },
                                { title: "Speed", desc: "Leverage Solana's high-throughput architecture to mirror trades in milliseconds.", icon: Cpu },
                                { title: "Control", desc: "Investors maintain absolute control. Reclaim your capital at any time without locks.", icon: MousePointer2 },
                                { title: "Analytics", desc: "Real-time P&L tracking powered by Pyth Network's institutional oracle feeds.", icon: PieChart }
                            ].map((feature, i) => (
                                <div key={i} className="group p-8 bg-slate-900 border border-slate-800 rounded-[2rem] hover:border-cyan-500/30 transition-all hover:-translate-y-1">
                                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center mb-6 border border-slate-800 group-hover:border-cyan-500/30 transition-all">
                                        <feature.icon className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-black italic uppercase text-white mb-2">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- WORKFLOW & CAPABILITIES (CANVAS SCHEMATIC) --- */}
            <section className="relative z-10 py-32 container mx-auto px-6 max-w-7xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white mb-4">Architecture</h2>
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Institutional Non-Custodial Protocol Schematic</p>
                </div>

                <div className="bg-slate-950 border-2 border-slate-800 rounded-[3rem] p-6 relative overflow-hidden shadow-2xl">
                    <WorkflowCanvas />

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center px-6">
                        <div className="p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl">
                            <p className="text-xs text-slate-400 leading-relaxed font-bold">
                                <span className="text-cyan-400">Cyan Particles</span> represent SOL/Asset deposits.
                                <span className="text-purple-400 ml-4">Purple Particles</span> represent real-time Trading Signals.<br/>
                                <span className="text-emerald-400 mt-2 block">Investor PDA</span> holds ownership shares, while the <span className="text-blue-400">Vault PDA</span> stores actual tokens.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Users className="w-16 h-16 text-cyan-400" /></div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase mb-3 italic tracking-widest">INVESTOR ROLES</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Discover top signal providers and automatically mirror their growth strategies while retaining 100% custody of your assets via PDA share minting.</p>
                    </div>
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Lock className="w-16 h-16 text-blue-400" /></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-3 italic tracking-widest">PROTOCOL CORE</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">The immutable smart contract handles vault settlement, commission distribution, and oracle-driven P&L tracking with institutional precision.</p>
                    </div>
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Zap className="w-16 h-16 text-purple-400" /></div>
                        <p className="text-[10px] font-black text-purple-400 uppercase mb-3 italic tracking-widest">TRADER ROLES</p>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Create custom non-custodial vaults, set performance-based commissions, and execute professional rotation signals for thousands of followers.</p>
                    </div>
                </div>
            </section>

            {/* --- ECOSYSTEM STATS (GAMIFIED) --- */}
            <section id="ecosystem" className="relative z-10 py-32 container mx-auto px-6 max-w-7xl">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <h2 className="text-5xl md:text-[5.5rem] font-black italic tracking-tighter uppercase text-white mb-12">
                        Join the <br /> <span className="text-cyan-400">Growth Engine.</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-16">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Traders</p>
                            <p className="text-5xl font-black tabular-nums text-white italic tracking-tighter">120+</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Successful Signals</p>
                            <p className="text-5xl font-black tabular-nums text-cyan-400 italic tracking-tighter">8,450</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Active Investors</p>
                            <p className="text-5xl font-black tabular-nums text-purple-400 italic tracking-tighter">1.2K</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link href="/investor" className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                            Start Copying <ChevronRight className="w-5 h-5" />
                        </Link>
                        <Link href="/trader" className="px-10 py-5 bg-slate-950 border border-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">
                            Apply to Lead
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="relative z-10 py-12 border-t border-slate-900 text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">CopyCatt Protocol © 2026 • Built on Solana</p>
            </footer>
        </main>
    );
}