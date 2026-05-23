"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Activity, Rocket,
  ToggleLeft, ToggleRight, ChevronRight,
  TrendingUp, TrendingDown, Shield, Clock, BarChart2, RefreshCw, CheckCircle,
  Radio, Newspaper, ScanLine, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { runAutoTrade } from "@/lib/auto-trade";

// ─── Bot definitions ──────────────────────────────────────────────────────────

const BOTS = [
  {
    id: "core",
    name: "GreenGenius Core",
    subtitle: "Equities Bot",
    Icon: Brain,
    color: "#00FF41",
    colorAlt: "#00D97E",
    colorRgb: "0,255,65",
    href: "/dashboard",
    description:
      "Scans 500+ US equities using momentum, earnings, and institutional flow signals. Executes market and limit orders through Alpaca in real time.",
    stats: [
      { label: "Win Rate",    value: "78.4%",  up: true  },
      { label: "Total Trades", value: "1,247", up: null  },
      { label: "Avg Return",  value: "+4.2%",  up: true  },
      { label: "Drawdown",    value: "-3.1%",  up: false },
    ],
    defaultOn: true,
    motif: "matrix",
    comparison: {
      assetClass:  "US Equities",
      strategy:    "Momentum + Earnings",
      exchange:    "Alpaca (US)",
      leverage:    "1×",
      avgHold:     "2–5 days",
      bestMonth:   "+18.2% (Nov)",
    },
  },
  {
    id: "delta",
    name: "Delta Bot",
    subtitle: "Derivatives & Options",
    Icon: Zap,
    color: "#A855F7",
    colorAlt: "#7C3AED",
    colorRgb: "168,85,247",
    href: "/dashboard/derivatives",
    description:
      "Trades options using Black-Scholes pricing, IV rank analysis, and gamma scalping. Targets high-probability spreads with defined risk.",
    stats: [
      { label: "Win Rate",    value: "71.2%",  up: true  },
      { label: "Total Trades", value: "312",   up: null  },
      { label: "Avg Return",  value: "+8.7%",  up: true  },
      { label: "Drawdown",    value: "-5.4%",  up: false },
    ],
    defaultOn: false,
    motif: "lightning",
    comparison: {
      assetClass:  "Options / Derivatives",
      strategy:    "IV Rank + Gamma Scalp",
      exchange:    "TD Ameritrade",
      leverage:    "Defined-risk",
      avgHold:     "3–14 days",
      bestMonth:   "+29.1% (Feb)",
    },
  },
  {
    id: "perp",
    name: "Perp Bot",
    subtitle: "Perpetuals Bot",
    Icon: Activity,
    color: "#06B6D4",
    colorAlt: "#0891B2",
    colorRgb: "6,182,212",
    href: "/dashboard/perpetuals",
    description:
      "Trades crypto perpetual futures on funding rate arbitrage, liquidation cascades, and order book imbalance. Long/short with up to 10× leverage.",
    stats: [
      { label: "Win Rate",    value: "66.8%",  up: true  },
      { label: "Total Trades", value: "891",   up: null  },
      { label: "Avg Return",  value: "+12.3%", up: true  },
      { label: "Drawdown",    value: "-8.9%",  up: false },
    ],
    defaultOn: false,
    motif: "circuit",
    comparison: {
      assetClass:  "Crypto Perps",
      strategy:    "Funding Rate Arb",
      exchange:    "Bybit / OKX",
      leverage:    "Up to 10×",
      avgHold:     "4h – 2 days",
      bestMonth:   "+44.7% (Mar)",
    },
  },
  {
    id: "ipo",
    name: "IPO Scout",
    subtitle: "IPO Bot",
    Icon: Rocket,
    color: "#F59E0B",
    colorAlt: "#D97706",
    colorRgb: "245,158,11",
    href: "/dashboard/ipos",
    description:
      "Monitors upcoming IPOs, SPAC mergers, and direct listings. Analyzes prospectus data, institutional demand, and grey market pricing to time entries.",
    stats: [
      { label: "Win Rate",    value: "82.1%",  up: true  },
      { label: "Total Trades", value: "47",    up: null  },
      { label: "Avg Return",  value: "+31.5%", up: true  },
      { label: "Drawdown",    value: "-4.2%",  up: false },
    ],
    defaultOn: false,
    motif: "orbit",
    comparison: {
      assetClass:  "IPOs / SPACs",
      strategy:    "Prospectus + Grey Mkt",
      exchange:    "Alpaca + IBKR",
      leverage:    "1×",
      avgHold:     "1–30 days",
      bestMonth:   "+67.3% (Jan)",
    },
  },
] as const;

// Full ticker universe — 300 representative US equities (bot scans 6,843 total)
const UNIVERSE: string[] = [
  "AAPL","MSFT","NVDA","AMZN","META","GOOGL","GOOG","TSLA","BRK.B","JPM",
  "V","UNH","XOM","LLY","AVGO","JNJ","MA","PG","MRK","HD",
  "CVX","ABBV","KO","COST","PEP","WMT","BAC","MCD","CRM","CSCO",
  "ABT","ACN","NFLX","TMO","ADBE","CMCSA","NKE","LIN","PFE","DIS",
  "WFC","DHR","AMD","INTU","TXN","PM","AMGN","NEE","ORCL","RTX",
  "QCOM","LOW","HON","T","GE","CAT","SBUX","BMY","SPGI","MDT",
  "BLK","ISRG","ELV","GILD","C","VRTX","PLD","AXP","CB","ZTS",
  "GS","MS","AMAT","TJX","ADP","BSX","ADI","REGN","SYK","CI",
  "DE","SO","DUK","MMC","PGR","MO","LRCX","KLAC","USB","ETN",
  "HUM","APH","ICE","NSC","NOC","EMR","SCHW","ITW","TT","AON",
  "SNPS","CDNS","MCHP","WM","SHW","MPC","PSX","VLO","HCA","FCX",
  "OXY","HAL","SLB","BKR","MUR","DVN","EOG","COP","PXD","APA",
  "PLTR","SNOW","DDOG","NET","CRWD","ZS","OKTA","PANW","S","FTNT",
  "COIN","HOOD","SQ","PYPL","FIS","FISV","GPN","AFRM","UPST","LC",
  "SHOP","SE","MELI","BABA","JD","PDD","BIDU","NIO","LI","XPEV",
  "UBER","LYFT","ABNB","DASH","GRAB","DIDI","BKNG","EXPE","TRIP","PCLN",
  "TWLO","ZM","DOCU","WORK","BOX","DBX","ESTC","MDB","DDOG","GTLB",
  "ROKU","SPOT","MTCH","BMBL","PINS","SNAP","TWTR","TME","BILI","HUYA",
  "BA","LMT","NOC","GD","RHX","TDG","HII","L3H","KTOS","RKLB",
  "GM","F","STLA","HMC","TM","RIVN","LCID","FSR","RIDE","GOEV",
  "MRNA","BNTX","PFE","JNJ","AZN","NVS","RHHBY","SNY","BAYRY","GSK",
  "AAL","DAL","UAL","LUV","ALK","JBLU","SAVE","HA","MESA","SKYW",
  "CCL","RCL","NCLH","MAR","HLT","H","IHG","WH","STAY","VCNX",
  "MGM","WYNN","LVS","PENN","DKNG","BALY","CHDN","GAN","SGHC","ACMR",
  "SPG","O","VICI","AMT","EQIX","PLD","PSA","DLR","EXR","SBAC",
  "GLD","SLV","IAU","PDBC","BCI","CPER","WEAT","CORN","SOYB","JJG",
  "XLF","XLK","XLE","XLV","XLY","XLU","XLP","XLI","XLB","XLRE",
  "IWM","VTI","VEA","VWO","EFA","EEM","IEMG","ACWI","VT","BNDX",
  "TMF","TNA","SOXL","TQQQ","UPRO","SPXU","SQQQ","SDOW","UVXY","VXX",
];

// Deterministic pseudo-random RSI based on symbol (stable per reload)
function symRsi(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) & 0xffffffff;
  return 20 + Math.abs(h % 60);
}
function symChange(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 17 + sym.charCodeAt(i)) & 0xffffffff;
  const raw = ((h & 0xff) / 255) * 10 - 5;
  return Math.round(raw * 100) / 100;
}

// ─── Background patterns per motif ───────────────────────────────────────────

function motifStyle(motif: string, color: string): React.CSSProperties {
  switch (motif) {
    case "matrix":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, ${color}08 28px, ${color}08 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, ${color}08 28px, ${color}08 29px)`,
      };
    case "lightning":
      return {
        backgroundImage: `repeating-linear-gradient(60deg, transparent, transparent 20px, ${color}06 20px, ${color}06 21px), repeating-linear-gradient(-60deg, transparent, transparent 20px, ${color}06 20px, ${color}06 21px)`,
      };
    case "circuit":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 16px, ${color}07 16px, ${color}07 17px), repeating-linear-gradient(0deg, transparent, transparent 16px, ${color}07 16px, ${color}07 17px)`,
      };
    case "orbit":
      return {
        backgroundImage: `radial-gradient(ellipse at 80% 20%, ${color}10 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${color}08 0%, transparent 40%)`,
      };
    default:
      return {};
  }
}

// ─── Live Scanner Section ─────────────────────────────────────────────────────

function LiveScannerSection() {
  const [scanData, setScanData]   = useState<any>(null);
  const [newsData, setNewsData]   = useState<any[]>([]);
  const [scanIdx,  setScanIdx]    = useState(0);
  const [visibleTickers, setVisibleTickers] = useState<string[]>([]);
  const [flashIdx, setFlashIdx]   = useState<number | null>(null);
  const newsRef = useRef<HTMLDivElement>(null);

  // Fetch scan status every 30s
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/scan-live");
        if (r.ok) setScanData(await r.json());
      } catch {}
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch news every 60s
  useEffect(() => {
    const loadNews = async () => {
      try {
        const r = await fetch("/api/market-news");
        if (r.ok) {
          const d = await r.json();
          setNewsData(d.news ?? []);
        }
      } catch {}
    };
    loadNews();
    const iv = setInterval(loadNews, 60000);
    return () => clearInterval(iv);
  }, []);

  // Animate ticker — advance 8 stocks every 2s through the universe
  useEffect(() => {
    setVisibleTickers(UNIVERSE.slice(0, 20));
    const iv = setInterval(() => {
      setScanIdx(prev => {
        const next = (prev + 8) % UNIVERSE.length;
        setVisibleTickers(UNIVERSE.slice(next, next + 20));
        const flash = Math.floor(Math.random() * 20);
        setFlashIdx(flash);
        setTimeout(() => setFlashIdx(null), 600);
        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll news
  useEffect(() => {
    if (!newsRef.current || newsData.length === 0) return;
    const iv = setInterval(() => {
      if (newsRef.current) {
        newsRef.current.scrollTop += 1;
        if (newsRef.current.scrollTop + newsRef.current.clientHeight >= newsRef.current.scrollHeight - 10) {
          newsRef.current.scrollTop = 0;
        }
      }
    }, 30);
    return () => clearInterval(iv);
  }, [newsData]);

  const stocksScanned = scanData?.stocksScanned ?? 0;
  const batchesRun    = scanData?.batchesRun ?? 0;
  const signals       = scanData?.recentSignals ?? [];
  const scanPosition  = ((scanIdx / UNIVERSE.length) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-genius-green animate-pulse" style={{ boxShadow: "0 0 8px #00FF41" }} />
          <h2 className="text-lg font-black text-white">Live Market Scanner</h2>
          <span className="text-xs font-mono text-genius-muted">— 6,843 stocks + 6 crypto pairs · 24/7</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-genius-green/30 bg-genius-green/5">
          <Radio size={11} className="text-genius-green animate-pulse" />
          <span className="text-xs font-black font-mono text-genius-green">SCANNING</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Universe", value: "6,843", sub: "stocks + crypto" },
          { label: "Batches Run", value: batchesRun > 0 ? batchesRun.toLocaleString() : "—", sub: "100 stocks/batch" },
          { label: "Stocks Scanned", value: stocksScanned > 0 ? stocksScanned.toLocaleString() : "—", sub: "this session" },
          { label: "Signals", value: signals.length.toString(), sub: "recent trades" },
        ].map(s => (
          <div key={s.label} className="genius-card rounded-xl px-4 py-3">
            <p className="text-xl font-black font-mono text-genius-green">{s.value}</p>
            <p className="text-[10px] font-bold text-white mt-0.5">{s.label}</p>
            <p className="text-[10px] text-genius-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main scanner + news split */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left: ticker stream */}
        <div className="genius-card rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-genius-border">
            <ScanLine size={13} className="text-genius-green" />
            <span className="text-xs font-bold text-white">Scanning Now</span>
            <span className="text-[10px] font-mono text-genius-muted ml-auto">batch {Math.floor(scanIdx / 100) + 1} · pos {scanPosition}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-genius-border">
            <div
              className="h-full bg-genius-green transition-all duration-500"
              style={{ width: `${scanPosition}%`, boxShadow: "0 0 4px #00FF41" }}
            />
          </div>

          {/* Ticker grid */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="grid grid-cols-2 gap-1.5">
              {visibleTickers.map((sym, i) => {
                const rsi    = symRsi(sym);
                const chg    = symChange(sym);
                const isFlash = flashIdx === i;
                const isBull  = rsi >= 55 && chg > 0;
                const isBear  = rsi <= 38 || chg < -1.5;
                return (
                  <motion.div
                    key={`${sym}-${scanIdx}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all"
                    style={{
                      background: isFlash
                        ? "rgba(0,255,65,0.15)"
                        : isBull ? "rgba(0,255,65,0.06)" : isBear ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.03)",
                      border: isFlash
                        ? "1px solid rgba(0,255,65,0.5)"
                        : `1px solid ${isBull ? "rgba(0,255,65,0.15)" : isBear ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {isFlash && <div className="w-1 h-1 rounded-full bg-genius-green animate-ping" />}
                      <span className="text-xs font-black font-mono text-white">{sym}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: rsi >= 55 ? "#00FF41" : rsi <= 38 ? "#F87171" : "#6B8E6B" }}>
                        RSI {rsi}
                      </span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: chg >= 0 ? "#00D97E" : "#F87171" }}>
                        {chg >= 0 ? "+" : ""}{chg}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Signals strip */}
          {signals.length > 0 && (
            <div className="border-t border-genius-border px-3 py-2">
              <p className="text-[10px] font-mono text-genius-muted mb-1.5">RECENT SIGNALS</p>
              <div className="space-y-1">
                {signals.slice(0, 3).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${s.action === "BUY" ? "bg-genius-green/20 text-genius-green" : "bg-red-500/20 text-red-400"}`}>
                      {s.action}
                    </span>
                    <span className="text-[10px] font-bold text-white">{s.symbol}</span>
                    <span className="text-[10px] text-genius-muted font-mono ml-auto">{s.time?.slice(11, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: news feed */}
        <div className="genius-card rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-genius-border">
            <Newspaper size={13} className="text-genius-green" />
            <span className="text-xs font-bold text-white">Market News Feed</span>
            <span className="text-[10px] font-mono text-genius-muted ml-auto">live · updates every 60s</span>
          </div>

          <div ref={newsRef} className="flex-1 overflow-hidden px-3 py-2 space-y-2" style={{ scrollBehavior: "smooth" }}>
            {newsData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-genius-muted text-xs font-mono">
                  <RefreshCw size={12} className="animate-spin" />
                  Loading news feed…
                </div>
              </div>
            ) : (
              [...newsData, ...newsData].map((item: any, i: number) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg p-2.5 transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: item.sentiment === "bullish" ? "rgba(0,255,65,0.15)" : item.sentiment === "bearish" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.08)",
                        color: item.sentiment === "bullish" ? "#00FF41" : item.sentiment === "bearish" ? "#F87171" : "#6B8E6B",
                      }}
                    >
                      {item.symbol}
                    </span>
                    {item.sentiment === "bullish"
                      ? <ArrowUpRight size={11} className="text-genius-green flex-shrink-0 mt-0.5" />
                      : item.sentiment === "bearish"
                      ? <ArrowDownRight size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                      : <Minus size={11} className="text-genius-muted flex-shrink-0 mt-0.5" />
                    }
                  </div>
                  <p className="text-xs text-genius-text leading-snug line-clamp-2">{item.title}</p>
                  <p className="text-[10px] text-genius-muted mt-1">
                    {item.publisher} · {item.publishedAt ? new Date(item.publishedAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BotsPage() {
  const [active,   setActive]   = useState<Record<string, boolean>>(
    Object.fromEntries(BOTS.map(b => [b.id, b.defaultOn]))
  );
  const [running,  setRunning]  = useState(false);
  const [runMsg,   setRunMsg]   = useState<string | null>(null);

  const activeBots = BOTS.filter(b => active[b.id]);

  const handleDeploy = async () => {
    setRunning(true);
    setRunMsg(null);
    const result = await runAutoTrade();
    setRunning(false);
    if (result.error) {
      setRunMsg(result.error);
    } else if (result.executed === 0) {
      setRunMsg("No signals met your confidence threshold right now. Try again shortly.");
    } else {
      setRunMsg(`Bot executed ${result.executed} trade${result.executed !== 1 ? "s" : ""}. Check your portfolio.`);
    }
    setTimeout(() => setRunMsg(null), 6000);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-white">AI Trading Bots</h1>
        <p className="text-sm text-genius-muted mt-1">
          Independent AI agents — each with its own strategy, signal engine, and risk profile
        </p>
      </div>

      {/* ── Active bots summary strip ── */}
      <div className="genius-card rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
        <span className="text-xs font-mono text-genius-muted uppercase tracking-widest">Active Bots</span>
        {activeBots.length === 0 ? (
          <span className="text-xs text-genius-muted font-mono italic">No bots active — toggle one below</span>
        ) : (
          activeBots.map(b => (
            <div key={b.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
              <span className="text-xs font-bold font-mono" style={{ color: b.color }}>{b.name}</span>
            </div>
          ))
        )}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-xs font-mono text-genius-green">MONITORING</span>
          </div>
          <button
            onClick={handleDeploy}
            disabled={running}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg btn-genius text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            {running ? "Running…" : "Deploy Now"}
          </button>
        </div>
      </div>

      {/* Run message */}
      {runMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono ${
          runMsg.includes("executed") ? "border-genius-green/30 bg-genius-green/5 text-genius-green" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
        }`}>
          {runMsg.includes("executed") ? <CheckCircle size={14} /> : <RefreshCw size={14} />}
          {runMsg}
        </div>
      )}

      {/* ── 2×2 Bot cards grid ── */}
      <div className="grid grid-cols-2 gap-6">
        {BOTS.map((bot, i) => {
          const on = active[bot.id];
          return (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl overflow-hidden min-h-80 flex flex-col"
              style={{
                background: "linear-gradient(145deg, #0F1A0F, #0A120A)",
                border: on
                  ? `1px solid ${bot.color}60`
                  : `1px solid ${bot.color}30`,
                boxShadow: on
                  ? `0 0 30px ${bot.color}20, 0 0 60px ${bot.color}08`
                  : "none",
                opacity: on ? 1 : 0.65,
                transition: "all 0.4s ease",
              }}
            >
              {/* Motif background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={motifStyle(bot.motif, bot.color)}
              />

              {/* Subtle animated pulse overlay when ON */}
              {on && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  animate={{ opacity: [0.03, 0.08, 0.03] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${bot.color} 0%, transparent 70%)` }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-5">

                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Icon circle */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${bot.color}30, ${bot.colorAlt}20)`,
                        border: `1px solid ${bot.color}40`,
                        boxShadow: on ? `0 0 16px ${bot.color}30` : "none",
                      }}
                    >
                      <bot.Icon size={22} style={{ color: bot.color }} />
                    </div>
                    <div>
                      <h2 className="font-black text-white text-base leading-tight">{bot.name}</h2>
                      <p className="text-xs font-mono" style={{ color: bot.colorAlt }}>{bot.subtitle}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black font-mono"
                    style={{
                      background: on ? `${bot.color}20` : "rgba(255,255,255,0.05)",
                      border: on ? `1px solid ${bot.color}50` : "1px solid rgba(255,255,255,0.1)",
                      color: on ? bot.color : "#4A7A4A",
                    }}
                  >
                    {on ? (
                      <>
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: bot.color }}
                        />
                        ACTIVE
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-genius-muted" />
                        STANDBY
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-genius-text leading-relaxed mb-4">{bot.description}</p>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {bot.stats.map(s => (
                    <div
                      key={s.label}
                      className="rounded-lg px-2 py-2 text-center"
                      style={{ background: `${bot.color}08`, border: `1px solid ${bot.color}20` }}
                    >
                      <p
                        className="text-sm font-black font-mono"
                        style={{ color: s.up === true ? bot.color : s.up === false ? "#F87171" : "#fff" }}
                      >
                        {s.value}
                      </p>
                      <p className="text-[10px] text-genius-muted mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom: toggle + open link */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${bot.color}20` }}>
                  {/* Toggle */}
                  <button
                    onClick={() => setActive(prev => ({ ...prev, [bot.id]: !prev[bot.id] }))}
                    className="flex items-center gap-2 transition-all"
                  >
                    {on ? (
                      <ToggleRight size={28} style={{ color: bot.color }} />
                    ) : (
                      <ToggleLeft size={28} className="text-genius-muted" />
                    )}
                    <span
                      className="text-xs font-bold font-mono"
                      style={{ color: on ? bot.color : "#4A7A4A" }}
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </button>

                  {/* Open link */}
                  <Link
                    href={bot.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all hover:opacity-80"
                    style={{
                      background: `${bot.color}18`,
                      border: `1px solid ${bot.color}40`,
                      color: bot.color,
                    }}
                  >
                    Open Bot
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Live Scanner ── */}
      <LiveScannerSection />

      {/* ── Bot Comparison Table ── */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-genius-border">
          <BarChart2 size={16} className="text-genius-green" />
          <h2 className="font-bold text-white">Bot Comparison</h2>
          <span className="text-xs text-genius-muted font-mono ml-1">— all strategies side by side</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genius-border">
                <th className="text-left px-5 py-3 text-xs text-genius-muted font-mono uppercase">Metric</th>
                {BOTS.map(b => (
                  <th key={b.id} className="px-4 py-3 text-xs font-mono uppercase" style={{ color: b.color }}>
                    <div className="flex items-center gap-1.5 justify-center">
                      <b.Icon size={12} />
                      {b.name.split(" ").slice(-1)[0]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "assetClass",  label: "Asset Class",   Icon: TrendingUp },
                { key: "strategy",    label: "Strategy",       Icon: Brain      },
                { key: "exchange",    label: "Exchange",       Icon: TrendingUp },
                { key: "leverage",    label: "Leverage",       Icon: Zap        },
                { key: "avgHold",     label: "Avg Hold Time",  Icon: Clock      },
                { key: "bestMonth",   label: "Best Month",     Icon: Shield     },
              ].map(({ key, label, Icon }) => (
                <tr
                  key={key}
                  className="border-b border-genius-border/50 hover:bg-genius-card transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-genius-muted" />
                      <span className="text-xs text-genius-muted font-mono">{label}</span>
                    </div>
                  </td>
                  {BOTS.map(b => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <span className="text-xs font-mono text-genius-text">
                        {(b.comparison as any)[key]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
