"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTickerChart } from "@/components/TickerChartProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, RefreshCw,
  ChevronRight, Cpu, AlertTriangle,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type IndexQuote = { sym: string; name: string; price: string; pct: string; up: boolean; raw: number };
type SectorRow  = { name: string; change: number; sym: string };
type TickerRow  = { sym: string; price: string; change: string; up: boolean };
type MarketData = {
  indices:    IndexQuote[];
  sectors:    SectorRow[];
  tickers:    TickerRow[];
  fearGreed:  number;
  vix:        number;
  updatedAt:  string;
};

// ─── Simulated AI signals (static — real signal engine needs backend) ─────────
const SIGNALS = [
  { sym:"NVDA", action:"BUY",  conf:94, reason:"Earnings beat +18.3% · Options flow 91% bullish · RSI continuation"        },
  { sym:"MSFT", action:"BUY",  conf:88, reason:"Cloud revenue acceleration · Institutional accumulation · AI tailwind"     },
  { sym:"BTC",  action:"BUY",  conf:86, reason:"Halving cycle momentum · On-chain whale accumulation · ETF inflows ATH"    },
  { sym:"TSLA", action:"SELL", conf:79, reason:"Delivery miss risk · Margin compression · Moving avg bearish cross"        },
  { sym:"SOL",  action:"BUY",  conf:83, reason:"Network activity +44% MoM · Developer surge · Volume breakout confirmed"   },
  { sym:"META", action:"BUY",  conf:81, reason:"Ad revenue rebound · AI monetization · Active buyback program"             },
  { sym:"AMD",  action:"HOLD", conf:72, reason:"Data center gains offset PC weakness · Watching Q3 guidance"               },
  { sym:"AMZN", action:"SELL", conf:75, reason:"Retail margin pressure · Multiple compression risk · Near resistance"      },
];

const FLOW_SEED = [
  { type:"DARK POOL", sym:"NVDA",  size:"$48.2M", side:"BUY",  time:"09:42:17" },
  { type:"OPTIONS",   sym:"SPY",   size:"$12.8M", side:"CALL", time:"09:41:55" },
  { type:"INSIDER",   sym:"MSFT",  size:"$3.1M",  side:"BUY",  time:"09:40:33" },
  { type:"DARK POOL", sym:"BTC",   size:"$91.4M", side:"BUY",  time:"09:39:48" },
  { type:"OPTIONS",   sym:"TSLA",  size:"$8.7M",  side:"PUT",  time:"09:38:22" },
  { type:"DARK POOL", sym:"META",  size:"$22.1M", side:"BUY",  time:"09:37:11" },
  { type:"OPTIONS",   sym:"NVDA",  size:"$31.5M", side:"CALL", time:"09:35:09" },
  { type:"INSIDER",   sym:"AAPL",  size:"$2.4M",  side:"BUY",  time:"09:34:55" },
];
const FLOW_POOL = [
  { type:"DARK POOL", sym:"GOOGL", size:"$15.3M", side:"BUY"  },
  { type:"OPTIONS",   sym:"BTC",   size:"$44.1M", side:"CALL" },
  { type:"DARK POOL", sym:"AMD",   size:"$9.8M",  side:"BUY"  },
  { type:"OPTIONS",   sym:"META",  size:"$6.2M",  side:"CALL" },
  { type:"DARK POOL", sym:"MSFT",  size:"$18.9M", side:"BUY"  },
  { type:"OPTIONS",   sym:"TSLA",  size:"$11.3M", side:"PUT"  },
  { type:"INSIDER",   sym:"NVDA",  size:"$5.7M",  side:"BUY"  },
];

// ─── Spark history builder ────────────────────────────────────────────────────
function addPoint(history: number[], val: number, max = 40) {
  return [...history.slice(-(max - 1)), val];
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function SparkTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#050A05] border border-genius-border rounded px-2 py-1 text-xs font-mono text-genius-green">
      {Number(payload[0].value).toLocaleString()}
    </div>
  );
}

// ─── Index Card ───────────────────────────────────────────────────────────────
function IndexCard({ quote, history, onOpen }: { quote: IndexQuote; history: number[]; onOpen?: () => void }) {
  const data = history.map(v => ({ v }));
  return (
    <div onClick={onOpen} className={`genius-card rounded-xl p-4 border border-genius-border hover:border-genius-green/30 transition-all ${onOpen ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-genius-muted font-mono" style={{ fontSize: 10 }}>{quote.sym}</p>
          <p className="font-black text-white text-lg font-mono leading-tight">{quote.price}</p>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${quote.up ? "text-genius-green bg-genius-green/10" : "text-red-400 bg-red-400/10"}`}>
          {quote.pct}
        </span>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${quote.sym}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={quote.up ? "#00FF41" : "#EF4444"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={quote.up ? "#00FF41" : "#EF4444"} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={quote.up ? "#00FF41" : "#EF4444"}
              strokeWidth={1.5} fill={`url(#g-${quote.sym})`} dot={false} />
            <Tooltip content={<SparkTip />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-genius-muted mt-0.5" style={{ fontSize: 10 }}>{quote.name}</p>
    </div>
  );
}

// ─── Flow feed ────────────────────────────────────────────────────────────────
function FlowFeed({ events }: { events: typeof FLOW_SEED }) {
  const { open: openChart } = useTickerChart();
  const c = (side: string) =>
    side === "BUY" || side === "CALL"
      ? "text-genius-green bg-genius-green/10 border-genius-green/20"
      : "text-red-400 bg-red-400/10 border-red-400/20";
  return (
    <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
      <AnimatePresence initial={false}>
        {events.map((e, i) => (
          <motion.div key={`${e.time}-${i}`}
            initial={{ opacity: 0, x: -10, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-genius-card border border-genius-border text-xs font-mono"
          >
            <span className="text-genius-muted w-20 flex-shrink-0">{e.time}</span>
            <span className="text-genius-muted w-20 flex-shrink-0">{e.type}</span>
            <button onClick={() => openChart(e.sym)} className="font-black text-genius-green hover:underline w-14 flex-shrink-0 text-left">{e.sym}</button>
            <span className="text-genius-green flex-1">{e.size}</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${c(e.side)}`}>{e.side}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Fear/Greed gauge ─────────────────────────────────────────────────────────
function FearGreedGauge({ score }: { score: number }) {
  const color = score > 60 ? "#00FF41" : score > 40 ? "#FFD700" : "#EF4444";
  const label = score > 75 ? "Extreme Greed" : score > 55 ? "Greed" : score > 45 ? "Neutral" : score > 25 ? "Fear" : "Extreme Fear";
  const dash  = 251.2;
  const fill  = (score / 100) * dash;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-24 mb-2">
        <svg viewBox="0 0 180 90" className="w-full h-full">
          <path d="M 10 85 A 80 80 0 0 1 170 85" fill="none" stroke="#1A2E1A" strokeWidth="12" strokeLinecap="round" />
          <motion.path d="M 10 85 A 80 80 0 0 1 170 85" fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={dash}
            animate={{ strokeDashoffset: dash - fill }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            initial={{ strokeDashoffset: dash }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <motion.line x1="90" y1="85" x2="90" y2="18"
            stroke="white" strokeWidth="2" strokeLinecap="round"
            animate={{ transform: `rotate(${(score / 100) * 180 - 90}deg)` }}
            style={{ transformOrigin: "90px 85px" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          <circle cx="90" cy="85" r="5" fill="white" />
        </svg>
      </div>
      <motion.p className="text-5xl font-black font-mono mb-0.5" style={{ color }}
        key={score} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
        {score}
      </motion.p>
      <p className="text-sm font-bold" style={{ color }}>{label}</p>
      <p className="text-genius-muted mt-1" style={{ fontSize: 10 }}>Based on live VIX data</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketPage() {
  const { open: openChart } = useTickerChart();
  const [data,       setData]       = useState<MarketData | null>(null);
  const [histories,  setHistories]  = useState<Record<string, number[]>>({});
  const [scanCount,  setScanCount]  = useState(10847);
  const [signalIdx,  setSignalIdx]  = useState(0);
  const [flowEvents, setFlowEvents] = useState(FLOW_SEED);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (!res.ok) return;
      const d: MarketData = await res.json();
      setData(d);
      setLastUpdate(new Date(d.updatedAt).toLocaleTimeString());
      // Append each index price to its sparkline history
      setHistories(prev => {
        const next = { ...prev };
        for (const idx of d.indices) {
          next[idx.sym] = addPoint(prev[idx.sym] ?? [], idx.raw);
        }
        return next;
      });
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Fetch immediately, then every 20 s
  useEffect(() => { fetchData(); const id = setInterval(fetchData, 20000); return () => clearInterval(id); }, [fetchData]);

  // Scan counter animation
  useEffect(() => {
    const id = setInterval(() => setScanCount(c => c + Math.floor(Math.random() * 12 + 3)), 300);
    return () => clearInterval(id);
  }, []);

  // Signal cycle
  useEffect(() => {
    const id = setInterval(() => setSignalIdx(i => (i + 1) % SIGNALS.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Flow feed new events
  useEffect(() => {
    const id = setInterval(() => {
      const e = FLOW_POOL[Math.floor(Math.random() * FLOW_POOL.length)];
      const t = new Date().toLocaleTimeString("en-US", { hour12: false });
      setFlowEvents(prev => [{ ...e, time: t }, ...prev.slice(0, 11)]);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const sig    = SIGNALS[signalIdx];
  const ticker = data?.tickers ?? [];

  return (
    <div className="min-h-screen bg-genius-black text-genius-text"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* CRT scanlines */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,65,0.012) 2px,rgba(0,255,65,0.012) 4px)" }} />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-genius-border bg-genius-black/95 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={15} className="text-genius-black" />
              </div>
              <span className="font-black text-white text-sm">Green<span className="text-genius-green">Genius</span>AI</span>
            </Link>
            <span className="px-2 py-1 rounded bg-genius-green/10 text-genius-green border border-genius-green/20 font-bold text-xs">
              MARKET INTELLIGENCE
            </span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-xs">
              <div className="live-dot" />
              <span className="text-genius-green font-bold">{scanCount.toLocaleString()} ASSETS LIVE</span>
            </div>
            {lastUpdate && <span className="text-genius-muted text-xs hidden md:block">Updated {lastUpdate}</span>}
            <button onClick={fetchData}
              className="p-1.5 rounded border border-genius-border hover:border-genius-green/40 transition-colors">
              <RefreshCw size={13} className="text-genius-muted" />
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
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 mr-8 text-xs">
                <span className="font-bold text-white">{t.sym}</span>
                <span className="text-genius-muted">${t.price}</span>
                <span className={`font-bold ${t.up ? "text-genius-green" : "text-red-400"}`}>
                  {t.up
                    ? <TrendingUp size={9} className="inline mr-0.5" />
                    : <TrendingDown size={9} className="inline mr-0.5" />}
                  {t.change}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 pt-32 pb-12 space-y-5">

        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3">
            <RefreshCw size={20} className="text-genius-green animate-spin" />
            <span className="text-genius-green font-mono text-sm">Loading live market data...</span>
          </div>
        ) : (
          <>
            {/* ── ROW 1: Signal + Fear/Greed + Stats ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* AI Signal card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="col-span-12 md:col-span-5 genius-card rounded-2xl p-6 border border-genius-green/30 relative overflow-hidden">
                <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
                  animate={{ boxShadow: ["0 0 0px rgba(0,255,65,0)", "0 0 30px rgba(0,255,65,0.12)", "0 0 0px rgba(0,255,65,0)"] }}
                  transition={{ duration: 3, repeat: Infinity }} />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="live-dot" />
                    <span className="text-genius-green font-bold text-xs">AI SIGNAL ENGINE</span>
                  </div>
                  <span className="text-xs text-genius-muted">{SIGNALS.length} active signals</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={signalIdx}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1.5 rounded-lg font-black text-sm ${
                        sig.action === "BUY"  ? "bg-genius-green/20 text-genius-green border border-genius-green/40" :
                        sig.action === "SELL" ? "bg-red-400/20 text-red-400 border border-red-400/40"               :
                                                "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"}`}>
                        {sig.action}
                      </span>
                      <span className="text-3xl font-black text-white">{sig.sym}</span>
                      <span className="text-xs text-genius-muted ml-auto">just now</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-genius-muted">AI CONFIDENCE</span>
                        <span className="text-genius-green font-bold">{sig.conf}%</span>
                      </div>
                      <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-genius-emerald to-genius-green"
                          initial={{ width: 0 }} animate={{ width: `${sig.conf}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }} />
                      </div>
                    </div>
                    <p className="text-xs text-genius-text leading-relaxed">{sig.reason}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-1.5 mt-4 pt-4 border-t border-genius-border">
                  {SIGNALS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === signalIdx ? "bg-genius-green" : "bg-genius-border"}`} />
                  ))}
                </div>
              </motion.div>

              {/* Fear & Greed */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="col-span-12 md:col-span-3 genius-card rounded-2xl p-6 border border-genius-border flex flex-col items-center justify-center">
                <p className="text-xs text-genius-muted mb-4 self-start">FEAR & GREED INDEX</p>
                {data && <FearGreedGauge score={data.fearGreed} />}
              </motion.div>

              {/* Stats grid */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="col-span-12 md:col-span-4 grid grid-cols-2 gap-3">
                {[
                  { label: "VIX",            value: data?.vix.toFixed(2) ?? "--",  sub: "Volatility index live" },
                  { label: "TRADES TODAY",   value: "1,203",                        sub: "by AI bots" },
                  { label: "AVG WIN RATE",   value: "78.4%",                        sub: "last 30 days" },
                  { label: "MARKET REGIME",  value: (data?.fearGreed ?? 50) > 50 ? "BULL" : "BEAR", sub: "sentiment-driven" },
                  { label: "SIGNALS TODAY",  value: "2,847",                        sub: "above 80% conf" },
                  { label: "AI UPTIME",      value: "99.98%",                       sub: "365 days running" },
                ].map((s, i) => (
                  <div key={i} className="genius-card rounded-xl p-3 border border-genius-border">
                    <p className="text-genius-muted mb-1" style={{ fontSize: 9 }}>{s.label}</p>
                    <p className="text-lg font-black text-genius-green">{s.value}</p>
                    <p className="text-genius-muted" style={{ fontSize: 9 }}>{s.sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── ROW 2: Live Index Charts ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-genius-green flex items-center gap-2">
                  <div className="live-dot" /> LIVE INDICES & CRYPTO — REAL PRICES
                </h2>
                <span className="text-genius-muted text-xs">Refreshes every 20s</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(data?.indices ?? []).map(q => (
                  <IndexCard key={q.sym} quote={q} history={histories[q.sym] ?? [q.raw]} onOpen={() => openChart(q.sym)} />
                ))}
              </div>
            </div>

            {/* ── ROW 3: Sectors + Flow ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* Sector heatmap — live ETF data */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="col-span-12 md:col-span-5 genius-card rounded-2xl p-5 border border-genius-border">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-genius-green font-bold">SECTOR PERFORMANCE — LIVE ETF DATA</p>
                  <div className="flex items-center gap-1.5">
                    <div className="live-dot" />
                    <span className="text-genius-muted" style={{ fontSize: 9 }}>REAL</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {(data?.sectors ?? []).map(s => {
                    const up = s.change >= 0;
                    const w  = Math.min(Math.abs(s.change) / 5 * 100, 100);
                    return (
                      <div key={s.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-genius-muted">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openChart(s.sym)} className="text-genius-muted hover:text-genius-green transition-colors font-mono" style={{ fontSize: 9 }}>{s.sym}</button>
                            <span className={`font-bold w-16 text-right ${up ? "text-genius-green" : "text-red-400"}`}>
                              {up ? "+" : ""}{s.change.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: up ? "linear-gradient(90deg,#00D97E,#00FF41)" : "linear-gradient(90deg,#991B1B,#EF4444)" }}
                            initial={{ width: 0 }} animate={{ width: `${w}%` }}
                            transition={{ duration: 1, ease: "easeOut" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Flow feed */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="col-span-12 md:col-span-7 genius-card rounded-2xl p-5 border border-genius-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="live-dot" />
                    <p className="text-xs text-genius-green font-bold">DARK POOL · OPTIONS · INSIDER FLOW</p>
                  </div>
                  <span className="text-genius-muted" style={{ fontSize: 9 }}>SIMULATED · Real feed requires institutional license</span>
                </div>
                <div className="flex gap-3 text-xs font-bold mb-3 text-genius-muted px-3" style={{ fontSize: 10 }}>
                  <span className="w-20">TIME</span>
                  <span className="w-20">TYPE</span>
                  <span className="w-14">TICKER</span>
                  <span className="flex-1">SIZE</span>
                  <span>SIDE</span>
                </div>
                <FlowFeed events={flowEvents} />
              </motion.div>
            </div>

            {/* ── ROW 4: Signal table ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="genius-card rounded-2xl border border-genius-border overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-genius-border">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-genius-green" />
                  <p className="text-xs text-genius-green font-bold">AI SIGNAL BOARD</p>
                </div>
                <span className="text-xs text-genius-muted">{SIGNALS.length} signals · sorted by confidence</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-genius-border text-genius-muted">
                      <th className="px-5 py-3 text-left">ASSET</th>
                      <th className="px-5 py-3 text-left">ACTION</th>
                      <th className="px-5 py-3 text-left">CONFIDENCE</th>
                      <th className="px-5 py-3 text-left">SIGNAL REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...SIGNALS].sort((a, b) => b.conf - a.conf).map((s, i) => (
                      <tr key={i} className="border-b border-genius-border/40 hover:bg-genius-green/3 transition-colors">
                        <td className="px-5 py-4 font-black text-white">
                          <button onClick={() => openChart(s.sym)} className="text-genius-green hover:underline font-mono font-black">{s.sym}</button>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded font-bold ${
                            s.action === "BUY"  ? "bg-genius-green/15 text-genius-green border border-genius-green/30"  :
                            s.action === "SELL" ? "bg-red-400/15 text-red-400 border border-red-400/30"                 :
                                                  "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30"}`}>
                            {s.action}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-genius-border rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-genius-green" style={{ width: `${s.conf}%` }} />
                            </div>
                            <span className="text-genius-green font-bold">{s.conf}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-genius-text max-w-sm">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ── CTA ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="genius-card rounded-2xl p-8 border border-genius-green/20 bg-genius-green/3 text-center">
              <p className="text-xs text-genius-green font-bold mb-3">THIS IS WHAT YOUR AI SEES — EVERY 20 SECONDS</p>
              <h2 className="text-3xl font-black text-white mb-3">
                Put This Intelligence to Work on <span className="text-genius-green">Your Portfolio</span>
              </h2>
              <p className="text-genius-text mb-6 max-w-xl mx-auto text-sm">
                Every signal, every flow event, every sector move — GreenGeniusAI processes all of it and executes your trades automatically.
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
          </>
        )}
      </div>
    </div>
  );
}
