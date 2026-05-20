"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Activity, Zap, Globe,
  BarChart3, ArrowUpRight, ArrowDownRight, ChevronRight,
  RefreshCw, AlertTriangle, Eye, Database, Cpu,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Ticker = { sym: string; price: string; change: string; up: boolean };

// ─── Static market data (simulated live) ─────────────────────────────────────
const INDICES = [
  { name: "S&P 500",  sym: "SPX",  base: 5287.76, vol: 4 },
  { name: "NASDAQ",   sym: "NDX",  base: 18432.14, vol: 8 },
  { name: "DOW",      sym: "DJI",  base: 39127.80, vol: 12 },
  { name: "VIX",      sym: "VIX",  base: 14.82, vol: 0.3, invert: true },
  { name: "BTC",      sym: "BTC",  base: 68240, vol: 400 },
  { name: "ETH",      sym: "ETH",  base: 3812, vol: 30 },
];

const SECTORS = [
  { name: "Technology",    change: +2.84, weight: 31 },
  { name: "Healthcare",    change: +0.42, weight: 13 },
  { name: "Financials",    change: +1.17, weight: 14 },
  { name: "Energy",        change: -0.63, weight: 5  },
  { name: "Consumer Disc", change: +1.91, weight: 11 },
  { name: "Industrials",   change: +0.78, weight: 9  },
  { name: "Crypto",        change: +3.41, weight: 7  },
  { name: "Real Estate",   change: -0.21, weight: 3  },
];

const SIGNALS = [
  { sym: "NVDA", action: "BUY",  conf: 94, reason: "Earnings beat +18.3% · Options flow 91% bullish · RSI continuation",       age: 2  },
  { sym: "MSFT", action: "BUY",  conf: 88, reason: "Cloud revenue acceleration · Institutional accumulation signal · AI tailwind", age: 7  },
  { sym: "BTC",  action: "BUY",  conf: 86, reason: "Halving cycle momentum · On-chain whale accumulation · ETF inflows ATH",     age: 14 },
  { sym: "TSLA", action: "SELL", conf: 79, reason: "Delivery miss risk · Margin compression trend · Moving avg bearish cross",   age: 21 },
  { sym: "SOL",  action: "BUY",  conf: 83, reason: "Network activity +44% MoM · Developer surge · Volume breakout confirmed",    age: 31 },
  { sym: "META", action: "BUY",  conf: 81, reason: "Ad revenue rebound · AI monetization early · Buyback program active",       age: 45 },
  { sym: "AMD",  action: "HOLD", conf: 72, reason: "Data center gains offset PC weakness · Watching Q3 guidance closely",        age: 52 },
  { sym: "AMZN", action: "SELL", conf: 75, reason: "Retail margin pressure · Multiple compression risk · Near resistance level", age: 68 },
];

const FLOW_EVENTS = [
  { type: "DARK POOL",  sym: "NVDA", size: "$48.2M",  side: "BUY",  time: "09:42:17" },
  { type: "OPTIONS",    sym: "SPY",  size: "$12.8M",  side: "CALL", time: "09:41:55" },
  { type: "INSIDER",    sym: "MSFT", size: "$3.1M",   side: "BUY",  time: "09:40:33" },
  { type: "DARK POOL",  sym: "BTC",  size: "$91.4M",  side: "BUY",  time: "09:39:48" },
  { type: "OPTIONS",    sym: "TSLA", size: "$8.7M",   side: "PUT",  time: "09:38:22" },
  { type: "DARK POOL",  sym: "META", size: "$22.1M",  side: "BUY",  time: "09:37:11" },
  { type: "INSIDER",    sym: "AMD",  size: "$1.8M",   side: "BUY",  time: "09:36:44" },
  { type: "OPTIONS",    sym: "NVDA", size: "$31.5M",  side: "CALL", time: "09:35:09" },
];

// ─── Spark chart generator ────────────────────────────────────────────────────
function makeSparkData(base: number, vol: number, points = 30) {
  const d = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v += (Math.random() - 0.45) * vol;
    d.push({ v: +v.toFixed(2) });
  }
  return d;
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────
function SparkTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded px-2 py-1 text-xs font-mono text-genius-green">
      {payload[0].value.toLocaleString()}
    </div>
  );
}

// ─── Index Card ────────────────────────────────────────────────────────────────
function IndexCard({ name, sym, base, vol, invert }: typeof INDICES[0]) {
  const [data, setData]   = useState(() => makeSparkData(base, vol));
  const [cur,  setCur]    = useState(base);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const tick = (Math.random() - 0.46) * vol;
      setCur(p => { const n = +(p + tick).toFixed(2); setDelta(n - base); setData(d => [...d.slice(1), { v: n }]); return n; });
    }, 800 + Math.random() * 400);
    return () => clearInterval(id);
  }, [base, vol]);

  const pct = ((delta / base) * 100);
  const up  = invert ? pct <= 0 : pct >= 0;

  return (
    <div className="genius-card rounded-xl p-4 border border-genius-border hover:border-genius-green/30 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-genius-muted font-mono">{sym}</p>
          <p className="font-black text-white text-lg font-mono leading-tight">
            {cur >= 1000 ? cur.toLocaleString("en-US", { maximumFractionDigits: 2 }) : cur.toFixed(2)}
          </p>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${up ? "text-genius-green bg-genius-green/10" : "text-red-400 bg-red-400/10"}`}>
          {up ? "+" : ""}{pct.toFixed(2)}%
        </span>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${sym}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={up ? "#00FF41" : "#EF4444"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={up ? "#00FF41" : "#EF4444"} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={up ? "#00FF41" : "#EF4444"} strokeWidth={1.5}
              fill={`url(#g-${sym})`} dot={false} />
            <Tooltip content={<SparkTip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-genius-muted mt-1">{name}</p>
    </div>
  );
}

// ─── Scrolling flow feed ───────────────────────────────────────────────────────
function FlowFeed() {
  const [events, setEvents] = useState(FLOW_EVENTS);

  useEffect(() => {
    const pool = [
      { type: "DARK POOL", sym: "GOOGL", size: "$15.3M", side: "BUY",  time: "" },
      { type: "OPTIONS",   sym: "BTC",   size: "$44.1M", side: "CALL", time: "" },
      { type: "DARK POOL", sym: "AMD",   size: "$9.8M",  side: "BUY",  time: "" },
      { type: "OPTIONS",   sym: "META",  size: "$6.2M",  side: "CALL", time: "" },
      { type: "INSIDER",   sym: "AAPL",  size: "$2.4M",  side: "BUY",  time: "" },
    ];
    const id = setInterval(() => {
      const e = pool[Math.floor(Math.random() * pool.length)];
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      setEvents(prev => [{ ...e, time: t }, ...prev.slice(0, 11)]);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const sideColor = (side: string) => {
    if (side === "BUY"  || side === "CALL") return "text-genius-green bg-genius-green/10 border-genius-green/20";
    if (side === "SELL" || side === "PUT")  return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-genius-muted bg-genius-muted/10 border-genius-muted/20";
  };

  return (
    <div className="space-y-1.5 overflow-y-auto max-h-[420px] pr-1">
      <AnimatePresence initial={false}>
        {events.map((e, i) => (
          <motion.div key={`${e.time}-${e.sym}-${i}`}
            initial={{ opacity: 0, x: -12, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-genius-card border border-genius-border"
          >
            <span className="text-genius-muted font-mono text-xs w-20 flex-shrink-0">{e.time}</span>
            <span className="text-genius-muted font-mono text-xs w-20 flex-shrink-0">{e.type}</span>
            <span className="font-black text-white font-mono text-sm w-14 flex-shrink-0">{e.sym}</span>
            <span className="text-genius-green font-mono text-xs flex-1">{e.size}</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${sideColor(e.side)}`}>{e.side}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MarketPage() {
  const [tickers,    setTickers]    = useState<Ticker[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [fearGreed,  setFearGreed]  = useState(67);
  const [scanCount,  setScanCount]  = useState(10847);
  const [signalIdx,  setSignalIdx]  = useState(0);

  // Live ticker fetch
  const fetchTickers = useCallback(async () => {
    try {
      const res = await fetch("/api/ticker");
      if (res.ok) { const d = await res.json(); if (d?.length) { setTickers(d); setLastUpdate(new Date()); } }
    } catch {}
  }, []);

  useEffect(() => { fetchTickers(); const id = setInterval(fetchTickers, 15000); return () => clearInterval(id); }, [fetchTickers]);

  // Live scan counter
  useEffect(() => {
    const id = setInterval(() => setScanCount(c => c + Math.floor(Math.random() * 12 + 3)), 300);
    return () => clearInterval(id);
  }, []);

  // Fear/greed drift
  useEffect(() => {
    const id = setInterval(() => setFearGreed(v => Math.max(10, Math.min(90, v + (Math.random() - 0.5) * 2))), 3000);
    return () => clearInterval(id);
  }, []);

  // Signal rotate
  useEffect(() => {
    const id = setInterval(() => setSignalIdx(i => (i + 1) % SIGNALS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const fgColor  = fearGreed > 60 ? "#00FF41" : fearGreed > 40 ? "#FFD700" : "#EF4444";
  const fgLabel  = fearGreed > 75 ? "Extreme Greed" : fearGreed > 55 ? "Greed" : fearGreed > 45 ? "Neutral" : fearGreed > 25 ? "Fear" : "Extreme Fear";
  const fgAngle  = (fearGreed / 100) * 180 - 90; // -90 to +90 degrees

  return (
    <div className="min-h-screen bg-genius-black text-genius-text" style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── SCAN LINE OVERLAY ── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.012) 2px, rgba(0,255,65,0.012) 4px)" }} />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-genius-border bg-genius-black/95 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={15} className="text-genius-black" />
              </div>
              <span className="font-black text-white text-sm">Green<span className="text-genius-green">Genius</span>AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-xs text-genius-muted">
              <span className="px-2 py-1 rounded bg-genius-green/10 text-genius-green border border-genius-green/20 font-bold">MARKET INTELLIGENCE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="live-dot" />
              <span className="text-genius-green font-bold">{scanCount.toLocaleString()} ASSETS LIVE</span>
            </div>
            <span className="text-genius-muted text-xs hidden md:block">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
            <button onClick={fetchTickers} className="p-1.5 rounded border border-genius-border hover:border-genius-green/40 transition-colors">
              <RefreshCw size={13} className="text-genius-muted hover:text-genius-green" />
            </button>
            <Link href="/auth?mode=signup" className="btn-genius px-4 py-1.5 rounded text-xs font-bold">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── TICKER STRIP ── */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-genius-dark border-b border-genius-border py-1.5 overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {[...(tickers.length ? tickers : [
              { sym:"AAPL",  price:"189.42", change:"+2.14%", up:true  },
              { sym:"NVDA",  price:"875.39", change:"+4.82%", up:true  },
              { sym:"TSLA",  price:"248.11", change:"-1.23%", up:false },
              { sym:"MSFT",  price:"414.67", change:"+1.07%", up:true  },
              { sym:"BTC",   price:"68,240", change:"+3.41%", up:true  },
              { sym:"ETH",   price:"3,812",  change:"+2.97%", up:true  },
              { sym:"SOL",   price:"178.44", change:"+5.11%", up:true  },
              { sym:"SPY",   price:"528.44", change:"+0.84%", up:true  },
              { sym:"AMZN",  price:"186.22", change:"-0.41%", up:false },
              { sym:"GOOGL", price:"170.58", change:"+1.55%", up:true  },
              { sym:"META",  price:"528.11", change:"+2.08%", up:true  },
              { sym:"AMD",   price:"152.33", change:"+1.44%", up:true  },
            ]), ...(tickers.length ? tickers : [])].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 mr-8 text-xs">
                <span className="font-bold text-white">{t.sym}</span>
                <span className="text-genius-muted">${t.price}</span>
                <span className={`font-bold ${t.up ? "text-genius-green" : "text-red-400"}`}>
                  {t.up ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                  {t.change}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 pt-32 pb-12 space-y-5">

        {/* ── ROW 1: AI Signal Hero + Fear/Greed + Market Status ── */}
        <div className="grid grid-cols-12 gap-4">

          {/* AI Signal Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="col-span-12 md:col-span-5 genius-card rounded-2xl p-6 border border-genius-green/30 relative overflow-hidden"
          >
            <motion.div className="absolute inset-0 rounded-2xl"
              animate={{ boxShadow: ["0 0 0px rgba(0,255,65,0)", "0 0 30px rgba(0,255,65,0.12)", "0 0 0px rgba(0,255,65,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <span className="text-genius-green font-bold text-xs">AI SIGNAL ENGINE</span>
              </div>
              <span className="text-xs text-genius-muted">{SIGNALS.length} active signals</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={signalIdx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1.5 rounded-lg font-black text-sm ${SIGNALS[signalIdx].action === "BUY" ? "bg-genius-green/20 text-genius-green border border-genius-green/40" : SIGNALS[signalIdx].action === "SELL" ? "bg-red-400/20 text-red-400 border border-red-400/40" : "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"}`}>
                    {SIGNALS[signalIdx].action}
                  </span>
                  <span className="text-3xl font-black text-white">{SIGNALS[signalIdx].sym}</span>
                  <span className="text-xs text-genius-muted ml-auto">{SIGNALS[signalIdx].age}m ago</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-genius-muted">AI CONFIDENCE</span>
                    <span className="text-genius-green font-bold">{SIGNALS[signalIdx].conf}%</span>
                  </div>
                  <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-genius-emerald to-genius-green"
                      initial={{ width: 0 }} animate={{ width: `${SIGNALS[signalIdx].conf}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <p className="text-xs text-genius-text leading-relaxed">{SIGNALS[signalIdx].reason}</p>
              </motion.div>
            </AnimatePresence>

            {/* Signal dots */}
            <div className="flex gap-1.5 mt-4 pt-4 border-t border-genius-border">
              {SIGNALS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === signalIdx ? "bg-genius-green" : "bg-genius-border"}`} />
              ))}
            </div>
          </motion.div>

          {/* Fear & Greed Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-12 md:col-span-3 genius-card rounded-2xl p-6 border border-genius-border flex flex-col items-center"
          >
            <p className="text-xs text-genius-muted mb-4 self-start">FEAR & GREED INDEX</p>
            {/* Semicircle gauge */}
            <div className="relative w-44 h-24 mb-3">
              <svg viewBox="0 0 180 90" className="w-full h-full">
                {/* Track */}
                <path d="M 10 85 A 80 80 0 0 1 170 85" fill="none" stroke="#1A2E1A" strokeWidth="12" strokeLinecap="round" />
                {/* Fill */}
                <motion.path d="M 10 85 A 80 80 0 0 1 170 85" fill="none"
                  stroke={fgColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="251.2"
                  animate={{ strokeDashoffset: 251.2 - (fearGreed / 100) * 251.2 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  initial={{ strokeDashoffset: 251.2 }}
                  style={{ filter: `drop-shadow(0 0 6px ${fgColor})` }}
                />
                {/* Needle */}
                <motion.line
                  x1="90" y1="85" x2="90" y2="18"
                  stroke="white" strokeWidth="2" strokeLinecap="round"
                  animate={{ transform: `rotate(${fgAngle}, 90, 85)` }}
                  style={{ transformOrigin: "90px 85px" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <circle cx="90" cy="85" r="5" fill="white" />
              </svg>
            </div>
            <motion.p className="text-5xl font-black font-mono mb-1" style={{ color: fgColor }}
              animate={{ color: fgColor }} transition={{ duration: 0.5 }}
            >
              {Math.round(fearGreed)}
            </motion.p>
            <p className="text-sm font-bold" style={{ color: fgColor }}>{fgLabel}</p>
            <p className="text-xs text-genius-muted mt-2">Market sentiment score</p>
          </motion.div>

          {/* Market status grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-12 md:col-span-4 grid grid-cols-2 gap-3"
          >
            {[
              { label: "SIGNALS TODAY",    value: "2,847",     sub: "above 80% conf",     color: "text-genius-green" },
              { label: "TRADES EXECUTED",  value: "1,203",     sub: "by AI bots",          color: "text-genius-green" },
              { label: "AVG WIN RATE",     value: "78.4%",     sub: "last 30 days",        color: "text-genius-green" },
              { label: "MARKET REGIME",    value: "BULL",      sub: "risk-on environment", color: "text-genius-green" },
              { label: "VOLATILITY",       value: "LOW",       sub: "VIX below 20",        color: "text-genius-green" },
              { label: "AI UPTIME",        value: "99.98%",    sub: "365 days running",    color: "text-genius-green" },
            ].map((s, i) => (
              <div key={i} className="genius-card rounded-xl p-3 border border-genius-border">
                <p className="text-xs text-genius-muted mb-1" style={{ fontSize: 9 }}>{s.label}</p>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-genius-muted" style={{ fontSize: 9 }}>{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── ROW 2: Live Index Charts ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-genius-green">LIVE INDICES & CRYPTO</h2>
            <span className="text-xs text-genius-muted">Auto-updating every second</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDICES.map((idx) => <IndexCard key={idx.sym} {...idx} />)}
          </div>
        </div>

        {/* ── ROW 3: Sector Heatmap + Flow Feed ── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Sector heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="col-span-12 md:col-span-5 genius-card rounded-2xl p-5 border border-genius-border"
          >
            <p className="text-xs text-genius-green font-bold mb-4">SECTOR PERFORMANCE</p>
            <div className="space-y-3">
              {SECTORS.map((s) => {
                const up = s.change >= 0;
                const w  = Math.min(Math.abs(s.change) / 4 * 100, 100);
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-genius-muted">{s.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-genius-muted" style={{ fontSize: 9 }}>wt {s.weight}%</span>
                        <span className={`font-bold w-14 text-right ${up ? "text-genius-green" : "text-red-400"}`}>
                          {up ? "+" : ""}{s.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: up ? "linear-gradient(90deg,#00D97E,#00FF41)" : "linear-gradient(90deg,#991B1B,#EF4444)" }}
                        initial={{ width: 0 }} whileInView={{ width: `${w}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Options / Dark Pool flow feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="col-span-12 md:col-span-7 genius-card rounded-2xl p-5 border border-genius-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <p className="text-xs text-genius-green font-bold">DARK POOL · OPTIONS · INSIDER FLOW</p>
              </div>
              <span className="text-xs text-genius-muted">Real-time</span>
            </div>
            <div className="flex gap-3 text-xs font-bold mb-3 text-genius-muted px-3">
              <span className="w-20">TIME</span>
              <span className="w-20">TYPE</span>
              <span className="w-14">TICKER</span>
              <span className="flex-1">SIZE</span>
              <span>SIDE</span>
            </div>
            <FlowFeed />
          </motion.div>
        </div>

        {/* ── ROW 4: All signals table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="genius-card rounded-2xl border border-genius-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-genius-border">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-genius-green" />
              <p className="text-xs text-genius-green font-bold">AI SIGNAL BOARD — ALL ACTIVE SIGNALS</p>
            </div>
            <span className="text-xs text-genius-muted">{SIGNALS.length} signals · Sorted by confidence</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-genius-border text-genius-muted">
                  <th className="px-5 py-3 text-left">ASSET</th>
                  <th className="px-5 py-3 text-left">ACTION</th>
                  <th className="px-5 py-3 text-left">CONFIDENCE</th>
                  <th className="px-5 py-3 text-left">SIGNAL REASON</th>
                  <th className="px-5 py-3 text-right">AGE</th>
                </tr>
              </thead>
              <tbody>
                {[...SIGNALS].sort((a, b) => b.conf - a.conf).map((sig, i) => (
                  <tr key={i} className="border-b border-genius-border/40 hover:bg-genius-green/3 transition-colors">
                    <td className="px-5 py-4 font-black text-white">{sig.sym}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded font-bold ${sig.action === "BUY" ? "bg-genius-green/15 text-genius-green border border-genius-green/30" : sig.action === "SELL" ? "bg-red-400/15 text-red-400 border border-red-400/30" : "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30"}`}>
                        {sig.action}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-genius-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-genius-green" style={{ width: `${sig.conf}%` }} />
                        </div>
                        <span className="text-genius-green font-bold">{sig.conf}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-genius-text max-w-sm">{sig.reason}</td>
                    <td className="px-5 py-4 text-right text-genius-muted">{sig.age}m ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── ROW 5: CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
          className="genius-card rounded-2xl p-8 border border-genius-green/20 bg-genius-green/3 text-center"
        >
          <p className="text-xs text-genius-green font-bold mb-3">THIS IS WHAT YOUR AI SEES — EVERY SECOND</p>
          <h2 className="text-3xl font-black text-white mb-3">
            Put This Intelligence to Work on <span className="text-genius-green">Your Portfolio</span>
          </h2>
          <p className="text-genius-text mb-6 max-w-xl mx-auto text-sm">
            Every signal, every flow event, every sector move — GreenGeniusAI processes all of it and executes your trades automatically. Start free in 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth?mode=signup&plan=genius" className="btn-genius px-8 py-3.5 rounded-xl font-black flex items-center justify-center gap-2">
              <Brain size={18} /> Start Free — Genius Plan
            </Link>
            <Link href="/demo" className="px-8 py-3.5 rounded-xl border border-genius-border text-genius-text hover:border-genius-green hover:text-genius-green transition-all font-bold flex items-center justify-center gap-2">
              Watch AI Demo <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
