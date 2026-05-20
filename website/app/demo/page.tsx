"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion, AnimatePresence, useInView, useSpring,
  useMotionValue, useTransform, animate,
} from "framer-motion";
import {
  Brain, ChevronRight, Zap, Activity, TrendingUp, CheckCircle,
  ArrowUpRight, Shield, Database, Cpu, Globe, Bell, BarChart3,
  Eye, Lock, AlertTriangle,
} from "lucide-react";

// ─── Neural Network SVG ───────────────────────────────────────────────────────
const LAYERS = [
  { label: "DATA IN",  nodes: 6, x: 80  },
  { label: "LAYER 1",  nodes: 8, x: 260 },
  { label: "LAYER 2",  nodes: 8, x: 440 },
  { label: "SIGNAL",   nodes: 3, x: 620 },
];
const H = 420;

function nodeY(count: number, idx: number) {
  const spacing = H / (count + 1);
  return spacing * (idx + 1);
}

const SIGNAL_PATHS = [
  [0,2, 1,1, 2,3, 3,0],
  [0,4, 1,5, 2,2, 3,0],
  [0,1, 1,3, 2,6, 3,0],
  [0,5, 1,0, 2,7, 3,1],
  [0,3, 1,6, 2,4, 3,2],
];

function NeuralNet({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 700 420" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* All background connections */}
      {LAYERS.slice(0, -1).map((layerA, li) => {
        const layerB = LAYERS[li + 1];
        return Array.from({ length: layerA.nodes }).flatMap((_, ai) =>
          Array.from({ length: layerB.nodes }).map((_, bi) => (
            <line
              key={`${li}-${ai}-${bi}`}
              x1={layerA.x} y1={nodeY(layerA.nodes, ai)}
              x2={layerB.x} y2={nodeY(layerB.nodes, bi)}
              stroke="rgba(0,255,65,0.06)" strokeWidth="0.8"
            />
          ))
        );
      })}

      {/* Animated signal paths */}
      {active && SIGNAL_PATHS.map((path, pi) => {
        const segments = [];
        for (let i = 0; i < path.length - 2; i += 2) {
          const la = LAYERS[i / 2];
          const lb = LAYERS[i / 2 + 1];
          const x1 = la.x, y1 = nodeY(la.nodes, path[i]);
          const x2 = lb.x, y2 = nodeY(lb.nodes, path[i + 2]);
          segments.push({ x1, y1, x2, y2, delay: pi * 0.3 + (i / 2) * 0.15 });
        }
        return segments.map((seg, si) => (
          <motion.line
            key={`sp-${pi}-${si}`}
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            stroke="#00FF41" strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 0.6, delay: seg.delay, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          />
        ));
      })}

      {/* Nodes */}
      {LAYERS.map((layer, li) =>
        Array.from({ length: layer.nodes }).map((_, ni) => {
          const isOutput = li === LAYERS.length - 1;
          const isBuy = isOutput && ni === 0;
          return (
            <motion.g key={`n-${li}-${ni}`}>
              {isBuy && active && (
                <motion.circle
                  cx={layer.x} cy={nodeY(layer.nodes, ni)} r={18}
                  fill="none" stroke="#00FF41"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ transformOrigin: `${layer.x}px ${nodeY(layer.nodes, ni)}px` }}
                />
              )}
              <motion.circle
                cx={layer.x} cy={nodeY(layer.nodes, ni)} r={isOutput ? 12 : 8}
                fill={isBuy && active ? "#00FF41" : "rgba(0,255,65,0.12)"}
                stroke={isBuy && active ? "#00FF41" : "rgba(0,255,65,0.35)"}
                strokeWidth="1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: li * 0.15 + ni * 0.04, duration: 0.4, type: "spring" }}
              />
              {isOutput && (
                <motion.text
                  x={layer.x + 18} y={nodeY(layer.nodes, ni) + 4}
                  fill={ni === 0 ? "#00FF41" : "rgba(0,255,65,0.4)"}
                  fontSize="10" fontFamily="JetBrains Mono" fontWeight="700"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {["BUY", "HOLD", "SELL"][ni]}
                </motion.text>
              )}
            </motion.g>
          );
        })
      )}

      {/* Layer labels */}
      {LAYERS.map((layer, li) => (
        <motion.text
          key={`lbl-${li}`}
          x={layer.x} y={H + 20} textAnchor="middle"
          fill="rgba(0,255,65,0.4)" fontSize="9" fontFamily="JetBrains Mono"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + li * 0.1 }}
        >
          {layer.label}
        </motion.text>
      ))}
    </svg>
  );
}

// ─── Terminal Typewriter ──────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 0,    color: "#4A7A4A", text: "$ GREENGENIUS_AI — SIGNAL ENGINE v4.2.1" },
  { delay: 0.4,  color: "#4A7A4A", text: "  Scanning 10,847 assets across 50+ feeds..." },
  { delay: 1.0,  color: "#00FF41", text: "  [SIGNAL LOCKED] NVDA — Confidence: 94.7%" },
  { delay: 1.5,  color: "#B8D4B8", text: "  ─ Earnings beat consensus by +18.3%" },
  { delay: 1.9,  color: "#B8D4B8", text: "  ─ GPU demand from AI sector at ATH" },
  { delay: 2.3,  color: "#B8D4B8", text: "  ─ Options flow: 91% CALL bias (3d exp)" },
  { delay: 2.7,  color: "#B8D4B8", text: "  ─ Institutional accumulation: +$1.2B" },
  { delay: 3.1,  color: "#B8D4B8", text: "  ─ RSI momentum: continuation signal" },
  { delay: 3.5,  color: "#B8D4B8", text: "  ─ Dark pool prints: bullish alignment" },
  { delay: 4.0,  color: "#00D97E", text: "  DECISION: BUY $2,847 NVDA @ $127.42" },
  { delay: 4.5,  color: "#00D97E", text: "  Stop-loss: $121.04  ·  Target: $151.80" },
  { delay: 5.1,  color: "#00FF41", text: "  ✓ Order placed — Execution time: 47ms" },
  { delay: 5.6,  color: "#4A7A4A", text: "  ─────────────────────────────────────" },
  { delay: 6.0,  color: "#4A7A4A", text: "  Monitoring position. Next scan: 14s." },
];

function TerminalWindow({ active }: { active: boolean }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  useEffect(() => {
    if (!active) { setVisibleLines([]); return; }
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="rounded-xl overflow-hidden border border-genius-border bg-[#030803] font-mono text-xs">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-genius-border bg-[#0A120A]">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-genius-green/60" />
        <span className="ml-2 text-genius-muted text-xs">ai-signal-engine — bash</span>
        {active && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="live-dot w-1.5 h-1.5" />
            <span className="text-genius-green" style={{ fontSize: 9 }}>RUNNING</span>
          </div>
        )}
      </div>
      {/* Terminal body */}
      <div className="p-5 space-y-1.5 min-h-[320px]">
        {TERMINAL_LINES.map((line, i) => (
          <AnimatePresence key={i}>
            {visibleLines.includes(i) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: line.color }}
                className="leading-relaxed"
              >
                {line.text}
                {i === visibleLines[visibleLines.length - 1] && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block w-1.5 h-3.5 bg-genius-green ml-0.5 align-middle"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function CountUp({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });

  useEffect(() => { if (inView) motionVal.set(to); }, [inView, to, motionVal]);
  useEffect(() => spring.on("change", v => { if (ref.current) ref.current.textContent = prefix + v.toFixed(decimals) + suffix; }), [spring, prefix, suffix, decimals]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ─── Data sources ─────────────────────────────────────────────────────────────
const DATA_SOURCES = [
  { icon: BarChart3, label: "NYSE / NASDAQ", detail: "Real-time price + volume", color: "#00FF41" },
  { icon: TrendingUp, label: "Options Flow",  detail: "Dark pool + unusual activity", color: "#00D97E" },
  { icon: Globe,      label: "Macro & Fed",   detail: "Rates, CPI, GDP releases",   color: "#7FFF00" },
  { icon: Activity,   label: "On-Chain Data", detail: "BTC/ETH wallet movements",   color: "#00BCD4" },
  { icon: Bell,       label: "News Sentiment","detail": "50,000+ sources / second",  color: "#C084FC" },
  { icon: Eye,        label: "Insider Filings","detail": "SEC Form 4 real-time",    color: "#FFD700" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [radarAngle, setRadarAngle]     = useState(0);
  const [scanCount,  setScanCount]      = useState(10847);
  const [neuralActive, setNeuralActive] = useState(false);
  const [terminalActive, setTerminalActive] = useState(false);

  const neuralRef   = useRef(null);
  const terminalRef = useRef(null);
  const neuralInView   = useInView(neuralRef,   { once: true, margin: "-100px" });
  const terminalInView = useInView(terminalRef, { once: true, margin: "-100px" });

  useEffect(() => { if (neuralInView)   setTimeout(() => setNeuralActive(true),   400); }, [neuralInView]);
  useEffect(() => { if (terminalInView) setTimeout(() => setTerminalActive(true), 600); }, [terminalInView]);

  // Radar sweep
  useEffect(() => {
    const id = setInterval(() => setRadarAngle(a => (a + 2) % 360), 20);
    return () => clearInterval(id);
  }, []);

  // Live scan counter
  useEffect(() => {
    const id = setInterval(() => setScanCount(c => c + Math.floor(Math.random() * 12 + 3)), 300);
    return () => clearInterval(id);
  }, []);

  const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
  const stagger = { show: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen bg-genius-black text-genius-text overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-genius-border bg-genius-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={18} className="text-genius-black" />
            </div>
            <span className="font-black text-xl text-white">Green<span className="text-genius-green">Genius</span>AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm text-genius-muted hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth?mode=signup" className="btn-genius px-5 py-2 rounded-lg text-sm font-bold">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── SECTION 1: HERO RADAR ─────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(0,255,65,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,1) 1px,transparent 1px)", backgroundSize: "48px 48px" }}
        />

        {/* Radar circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[340, 260, 180, 110].map((r, i) => (
            <div key={i} className="absolute rounded-full border border-genius-green/10"
              style={{ width: r * 2, height: r * 2 }} />
          ))}
          {/* Radar sweep */}
          <div className="absolute rounded-full overflow-hidden" style={{ width: 680, height: 680 }}>
            <div className="absolute inset-0 rounded-full" style={{
              background: `conic-gradient(from ${radarAngle}deg, transparent 0deg, rgba(0,255,65,0.15) 40deg, rgba(0,255,65,0.05) 80deg, transparent 120deg)`,
            }} />
          </div>
          {/* Scan dot */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-genius-green"
            style={{
              boxShadow: "0 0 10px #00FF41, 0 0 20px #00FF41",
              x: 320 * Math.cos((radarAngle * Math.PI) / 180) - 4,
              y: 320 * Math.sin((radarAngle * Math.PI) / 180) - 4,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-genius-border bg-genius-card mb-8">
              <div className="live-dot" />
              <span className="text-xs font-mono text-genius-green font-bold">AI ENGINE — LIVE DEMO</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-none mb-6">
              Watch the<br />
              <span className="text-genius-green glow-text">AI Think.</span>
            </h1>
            <p className="text-xl text-genius-text max-w-2xl mx-auto mb-10">
              This is exactly what happens inside GreenGeniusAI every second — from raw data ingestion to a live trade — in real time.
            </p>
          </motion.div>

          {/* Live counters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {[
              { label: "ASSETS SCANNED", value: scanCount.toLocaleString() },
              { label: "SIGNALS ANALYZED TODAY", value: "2,847,302" },
              { label: "AVG EXECUTION", value: "47ms" },
              { label: "UPTIME", value: "99.98%" },
            ].map((s, i) => (
              <div key={i} className="text-center px-5 py-3 rounded-xl border border-genius-border bg-genius-card/60 backdrop-blur">
                <p className="text-2xl font-black text-genius-green font-mono">{s.value}</p>
                <p className="text-xs text-genius-muted font-mono mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <a href="#phase-1"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-genius-green/40 text-genius-green hover:bg-genius-green/5 transition-all font-bold"
            >
              <Zap size={18} /> See Every Phase
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-genius-green/60 to-transparent" />
          <span className="text-xs text-genius-muted font-mono">SCROLL TO EXPLORE</span>
        </motion.div>
      </section>

      {/* ── SECTION 2: PHASE OVERVIEW ─────────────────────────────── */}
      <section className="py-24 px-4 border-t border-genius-border bg-genius-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-genius-green font-mono text-sm font-bold mb-3">THE PROCESS</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-black text-white mb-4">
              5 Phases. <span className="text-genius-green">One Perfect Trade.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-genius-text max-w-2xl mx-auto">
              Every trade GreenGeniusAI executes goes through the same rigorous five-phase intelligence pipeline — from raw signal to executed position.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-5 gap-4"
          >
            {[
              { num: "01", icon: Database,   label: "INGEST",  desc: "50+ live data sources" },
              { num: "02", icon: Cpu,         label: "PROCESS", desc: "Neural pattern matching" },
              { num: "03", icon: Activity,    label: "DETECT",  desc: "High-prob signal lock" },
              { num: "04", icon: Zap,         label: "EXECUTE", desc: "Sub-50ms trade order" },
              { num: "05", icon: Eye,         label: "MONITOR", desc: "Continuous exit watch" },
            ].map((phase, i) => (
              <motion.div key={i} variants={fadeUp}
                className="relative genius-card rounded-2xl p-5 text-center overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-genius-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-5xl font-black text-genius-border font-mono absolute top-3 right-3 leading-none">{phase.num}</span>
                <div className="w-10 h-10 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center mx-auto mb-3">
                  <phase.icon size={18} className="text-genius-green" />
                </div>
                <p className="font-black text-genius-green text-xs font-mono mb-1">{phase.label}</p>
                <p className="text-xs text-genius-muted">{phase.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: DATA INGESTION ─────────────────────────────── */}
      <section id="phase-1" className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-genius-green/10 border border-genius-green/20 mb-6">
                <span className="text-genius-green font-mono text-xs font-bold">PHASE 01 — DATA INGESTION</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-white mb-6">
                50+ Live Feeds.<br />
                <span className="text-genius-green">0 Missed Signals.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-genius-text leading-relaxed mb-8">
                While your advisor checks email, GreenGeniusAI is simultaneously processing price action, options flow, insider filings, on-chain data, macro releases, and sentiment from 50,000+ sources — every second.
              </motion.p>
              <motion.div variants={stagger} className="space-y-3">
                {["10,847 assets tracked in real-time", "50,000+ news sources analyzed per second", "SEC filings processed within 200ms of release", "Dark pool data cross-referenced every 15 seconds"].map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-genius-green flex-shrink-0" />
                    <span className="text-sm text-genius-text">{f}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 gap-3"
            >
              {DATA_SOURCES.map((src, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="genius-card rounded-xl p-4 border border-genius-border group hover:border-genius-green/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${src.color}15`, border: `1px solid ${src.color}30` }}>
                      <src.icon size={15} style={{ color: src.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{src.label}</p>
                      <p className="text-genius-muted text-xs mt-0.5">{src.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-genius-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: src.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${75 + i * 4}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs font-mono" style={{ color: src.color }}>LIVE</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 4: NEURAL NETWORK ─────────────────────────────── */}
      <section className="py-28 px-4 border-y border-genius-border bg-genius-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-genius-green/10 border border-genius-green/20 mb-6">
                <span className="text-genius-green font-mono text-xs font-bold">PHASE 02 — NEURAL PROCESSING</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
                20 Years of Market Data.<br />
                <span className="text-genius-green">Compressed Into Every Decision.</span>
              </h2>
              <p className="text-genius-text max-w-2xl mx-auto">
                Our proprietary neural architecture processes hundreds of variables simultaneously — finding non-obvious correlations that no human analyst could detect in real-time.
              </p>
            </motion.div>
          </div>

          <div ref={neuralRef} className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={neuralInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="genius-card rounded-2xl p-8 border border-genius-border"
            >
              {/* Glow overlay */}
              {neuralActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{ boxShadow: ["0 0 0px rgba(0,255,65,0)", "0 0 40px rgba(0,255,65,0.12)", "0 0 0px rgba(0,255,65,0)"] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}
              <div className="h-[480px]">
                <NeuralNet active={neuralActive} />
              </div>
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-genius-border">
                {[
                  { label: "Input Variables",    value: "847" },
                  { label: "Network Parameters", value: "12.4M" },
                  { label: "Training Data Points","value": "20yr" },
                  { label: "Inference Time",     value: "< 3ms" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-black text-genius-green font-mono">{s.value}</p>
                    <p className="text-xs text-genius-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: SIGNAL LOCK ────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left: visual */}
            <motion.div variants={fadeUp} className="order-2 lg:order-1">
              <div className="genius-card rounded-2xl p-8 border border-genius-green/30 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ boxShadow: ["0 0 0 1px rgba(0,255,65,0.1)", "0 0 40px rgba(0,255,65,0.2)", "0 0 0 1px rgba(0,255,65,0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Scanning header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-genius-muted font-mono mb-1">SIGNAL DETECTED</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-white font-mono">NVDA</span>
                      <span className="text-sm text-genius-muted">NVIDIA Corp</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="px-3 py-1.5 rounded-lg bg-genius-green/15 border border-genius-green/40"
                  >
                    <span className="text-genius-green font-mono font-black text-sm">BUY</span>
                  </motion.div>
                </div>

                {/* Confidence meter */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-genius-muted font-mono">AI CONFIDENCE</span>
                    <motion.span
                      className="text-2xl font-black text-genius-green font-mono"
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    >
                      94.7%
                    </motion.span>
                  </div>
                  <div className="w-full h-3 bg-genius-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #00D97E, #00FF41)" }}
                      initial={{ width: 0 }}
                      whileInView={{ width: "94.7%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-genius-muted font-mono mt-1">
                    <span>Threshold: 80%</span><span className="text-genius-green">✓ EXCEEDS THRESHOLD</span>
                  </div>
                </div>

                {/* Signal factors */}
                {[
                  { factor: "Earnings Surprise",    score: 97, color: "#00FF41" },
                  { factor: "Options Flow",         score: 91, color: "#00FF41" },
                  { factor: "Institutional Flow",   score: 88, color: "#00D97E" },
                  { factor: "Technical Momentum",   score: 84, color: "#00D97E" },
                  { factor: "Sentiment Score",      score: 79, color: "#7FFF00" },
                ].map((s, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-genius-muted font-mono">{s.factor}</span>
                      <span className="font-mono font-bold" style={{ color: s.color }}>{s.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-genius-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-5 pt-5 border-t border-genius-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-genius-muted font-mono mb-1">ENTRY PRICE</p>
                    <p className="font-black text-white font-mono">$127.42</p>
                  </div>
                  <div>
                    <p className="text-xs text-genius-muted font-mono mb-1">TARGET</p>
                    <p className="font-black text-genius-green font-mono">$151.80</p>
                  </div>
                  <div>
                    <p className="text-xs text-genius-muted font-mono mb-1">STOP-LOSS</p>
                    <p className="font-black text-red-400 font-mono">$121.04</p>
                  </div>
                  <div>
                    <p className="text-xs text-genius-muted font-mono mb-1">RISK/REWARD</p>
                    <p className="font-black text-genius-green font-mono">1 : 3.8</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: copy */}
            <div className="order-1 lg:order-2">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-genius-green/10 border border-genius-green/20 mb-6">
                <span className="text-genius-green font-mono text-xs font-bold">PHASE 03 — SIGNAL DETECTION</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-white mb-6">
                Only the Highest<br />
                <span className="text-genius-green">Confidence Trades.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-genius-text leading-relaxed mb-8">
                The AI only acts when multiple independent signals align above its confidence threshold. No gut calls. No emotion. Just data-driven precision — the same approach used by top quantitative hedge funds.
              </motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  "Multi-factor signal validation before any trade",
                  "Adjustable confidence threshold (70%, 80%, 90%)",
                  "Risk/reward calculation before execution",
                  "Automatic stop-loss assignment on every position",
                ].map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle size={15} className="text-genius-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-genius-text">{f}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6: TERMINAL ───────────────────────────────────── */}
      <section className="py-28 px-4 border-y border-genius-border bg-genius-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-genius-green/10 border border-genius-green/20 mb-6">
                  <span className="text-genius-green font-mono text-xs font-bold">PHASE 04 — EXECUTION</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-6">
                  Executed in <span className="text-genius-green">47ms.</span><br />
                  Explained in Plain English.
                </h2>
                <p className="text-genius-text leading-relaxed mb-8">
                  The moment the signal locks, the trade fires. But unlike every other AI system, GreenGeniusAI immediately generates a human-readable explanation of exactly why — so you're never in the dark about what's happening with your money.
                </p>
                <div className="space-y-3">
                  {[
                    "Trade executes in under 50 milliseconds",
                    "Push notification sent to your phone instantly",
                    "Full AI reasoning in plain English",
                    "Position added to real-time portfolio tracker",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={15} className="text-genius-green flex-shrink-0" />
                      <span className="text-sm text-genius-text">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              ref={terminalRef}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <TerminalWindow active={terminalActive} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: RESULT ─────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-genius-green/10 border border-genius-green/20 mb-6">
                <span className="text-genius-green font-mono text-xs font-bold">PHASE 05 — THE RESULT</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
                6 Days Later. <span className="text-genius-green">+18.4%.</span>
              </h2>
              <p className="text-genius-text max-w-2xl mx-auto">
                The AI monitors the position continuously. When momentum peaks, it exits before the decline. Every time. This is the NVDA trade outcome from the signal above.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Entry",       value: "$127.42",  sub: "AI buy signal",          color: "text-white" },
              { label: "Exit",        value: "$150.89",  sub: "AI sell signal — Day 6",  color: "text-genius-green" },
              { label: "Return",      value: "+18.4%",   sub: "On $2,847 invested",      color: "text-genius-green" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.12 }}
                className="genius-card rounded-2xl p-8 text-center border border-genius-border"
              >
                <p className="text-xs text-genius-muted font-mono mb-3">{s.label.toUpperCase()}</p>
                <p className={`text-4xl font-black font-mono mb-2 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-genius-muted">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart bars simulation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="genius-card rounded-2xl p-8 border border-genius-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-genius-muted font-mono mb-1">NVDA — 6-DAY POSITION TRACK</p>
                <p className="text-2xl font-black text-genius-green font-mono">+$523.65 <span className="text-sm text-genius-muted font-normal">realized gain</span></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-genius-green" /><span className="text-genius-muted">AI Entry</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-genius-muted">AI Exit</span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2 h-36">
              {[62, 67, 73, 80, 89, 96, 100, 98, 97, 99, 100, 98, 96, 94, 91].map((h, i) => {
                const isEntry = i === 2;
                const isExit  = i === 12;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {isEntry && <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-genius-green" />}
                    {isExit  && <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-red-400" />}
                    {!isEntry && !isExit && <div className="h-[10px]" />}
                    <motion.div
                      className="w-full rounded-sm"
                      style={{
                        background: i >= 2 && i <= 12
                          ? (i === 12 ? "#EF4444" : "linear-gradient(to top, #00FF41, #00D97E)")
                          : "rgba(0,255,65,0.15)",
                      }}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-genius-border flex flex-wrap gap-4 text-xs text-genius-muted font-mono">
              <span>Day 1–2: Pre-signal monitoring</span>
              <span className="text-genius-green">Day 3: BUY @ $127.42</span>
              <span>Day 3–8: Position monitored every 15s</span>
              <span className="text-red-400">Day 9: EXIT @ $150.89 — momentum peak detected</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 8: STATS ──────────────────────────────────────── */}
      <section className="py-24 px-4 border-y border-genius-border bg-genius-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-black text-white mb-3">
                The Numbers Behind <span className="text-genius-green">the Intelligence</span>
              </h2>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { to: 78.4, suffix: "%",    label: "Trade Win Rate",         sub: "Backtested 2019–2024" },
              { to: 14.2, suffix: "%",    label: "Avg Monthly Return",     sub: "Backtested on live data" },
              { to: 47,   suffix: "ms",   label: "Avg Execution Time",     sub: "From signal to order" },
              { to: 99.98, suffix: "%", decimals: 2, label: "System Uptime", sub: "Always watching" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-black text-genius-green font-mono mb-1">
                  <CountUp to={s.to} decimals={s.decimals ?? 1} suffix={s.suffix} />
                </p>
                <p className="font-bold text-white text-sm mb-1">{s.label}</p>
                <p className="text-xs text-genius-muted">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,255,65,0.08) 0%, transparent 70%)" }}
        />
        {/* Animated ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[600, 500, 400].map((r, i) => (
            <motion.div key={i} className="absolute rounded-full border border-genius-green/10"
              style={{ width: r, height: r }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
              The AI Is Ready.<br />
              <span className="text-genius-green glow-text">Are You?</span>
            </h2>
            <p className="text-genius-text text-xl mb-10">
              Start a free 7-day trial. No credit card. The AI begins working for your portfolio from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=signup&plan=genius"
                className="btn-genius inline-flex items-center gap-2 px-10 py-5 rounded-xl text-lg font-black"
              >
                <Brain size={20} /> Start Free — Genius Plan
              </Link>
              <Link href="/#pricing"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-xl border border-genius-border text-genius-text hover:border-genius-green hover:text-genius-green transition-all font-bold"
              >
                Compare Plans <ArrowUpRight size={18} />
              </Link>
            </div>
            <p className="text-xs text-genius-muted mt-5">7-day free trial · No credit card · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-genius-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={15} className="text-genius-black" />
            </div>
            <span className="font-black text-white">GreenGeniusAI</span>
          </Link>
          <div className="flex flex-wrap gap-6 text-xs text-genius-muted">
            <Link href="/" className="hover:text-genius-green transition-colors">Home</Link>
            <Link href="/about" className="hover:text-genius-green transition-colors">About</Link>
            <Link href="/auth?mode=signup" className="hover:text-genius-green transition-colors">Get Started</Link>
          </div>
          <p className="text-xs text-genius-muted">
            <AlertTriangle size={10} className="inline mr-1" />
            Past performance is not indicative of future results.
          </p>
        </div>
      </footer>
    </div>
  );
}
