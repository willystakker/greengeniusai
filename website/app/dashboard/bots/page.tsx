"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Activity, Rocket,
  ToggleLeft, ToggleRight, ChevronRight,
  TrendingUp, Shield, Clock, BarChart2, RefreshCw, CheckCircle,
  Radio, Newspaper, ScanLine, ArrowUpRight, ArrowDownRight, Minus, Cpu, Wifi,
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

// Full ticker universe
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
  "SNPS","CDNS","MCHP","WM","SHW","MPC","PSX","VLO","HCA","FCX",
  "OXY","HAL","SLB","BKR","DVN","EOG","COP","PXD","APA","MUR",
  "PLTR","SNOW","DDOG","NET","CRWD","ZS","OKTA","PANW","S","FTNT",
  "COIN","HOOD","SQ","PYPL","FIS","FISV","GPN","AFRM","UPST","LC",
  "SHOP","SE","MELI","BABA","JD","PDD","BIDU","NIO","LI","XPEV",
  "UBER","LYFT","ABNB","DASH","BKNG","EXPE","TWLO","ZM","DOCU","MDB",
  "ROKU","SPOT","MTCH","BMBL","PINS","SNAP","BA","LMT","NOC","GD",
  "GM","F","RIVN","LCID","MRNA","BNTX","AAL","DAL","UAL","LUV",
  "CCL","RCL","NCLH","MAR","HLT","MGM","WYNN","LVS","PENN","DKNG",
  "SPG","O","VICI","AMT","EQIX","PSA","DLR","EXR","SBAC","IRM",
  "XLF","XLK","XLE","XLV","XLY","IWM","QQQ","SPY","VTI","GLD",
  "TMF","TNA","SOXL","TQQQ","UPRO","UVXY","COIN","MSTR","MARA","RIOT",
  "INTC","MU","QCOM","ARM","SMCI","DELL","HPQ","IBM","SAP","ORCL",
  "TGT","WMT","COST","AMZN","EBAY","ETSY","W","OSTK","CHWY","PET",
  "CVS","WBA","MCK","ABC","CAH","HUM","CNC","MOH","ELV","ANTM",
  "PXD","DVN","HAL","SLB","OXY","MPC","PSX","VLO","EOG","COP",
  "RBLX","U","TTWO","EA","ATVI","NTDOY","SNE","MSFT","AMZN","GOOGL",
  "TSLA","RIVN","LCID","FSR","NIO","XPEV","LI","NKLA","HYLN","RIDE",
  "SPCE","RKLB","ASTS","MNTS","LHX","NOC","RTX","BA","GD","HII",
  "SQ","PYPL","MA","V","AXP","COF","DFS","SYF","ALLY","LC",
];

function symRsi(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) & 0xffffffff;
  return 20 + Math.abs(h % 60);
}
function symChange(sym: string): number {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 17 + sym.charCodeAt(i)) & 0xffffffff;
  return Math.round((((h & 0xff) / 255) * 10 - 5) * 100) / 100;
}

// ─── Motif bg ─────────────────────────────────────────────────────────────────

function motifStyle(motif: string, color: string): React.CSSProperties {
  switch (motif) {
    case "matrix":
      return { backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 28px,${color}08 28px,${color}08 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,${color}08 28px,${color}08 29px)` };
    case "lightning":
      return { backgroundImage: `repeating-linear-gradient(60deg,transparent,transparent 20px,${color}06 20px,${color}06 21px),repeating-linear-gradient(-60deg,transparent,transparent 20px,${color}06 20px,${color}06 21px)` };
    case "circuit":
      return { backgroundImage: `repeating-linear-gradient(90deg,transparent,transparent 16px,${color}07 16px,${color}07 17px),repeating-linear-gradient(0deg,transparent,transparent 16px,${color}07 16px,${color}07 17px)` };
    case "orbit":
      return { backgroundImage: `radial-gradient(ellipse at 80% 20%,${color}10 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,${color}08 0%,transparent 40%)` };
    default: return {};
  }
}

// ─── Cyber corner bracket decoration ─────────────────────────────────────────

function CyberCorners({ color, size = 10 }: { color: string; size?: number }) {
  const s = size;
  const c = color;
  return (
    <>
      {/* TL */}
      <div className="absolute top-0 left-0 pointer-events-none" style={{ width: s * 2, height: s * 2 }}>
        <div className="absolute top-0 left-0" style={{ width: s, height: 2, background: c, boxShadow: `0 0 6px ${c}` }} />
        <div className="absolute top-0 left-0" style={{ width: 2, height: s, background: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
      {/* TR */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{ width: s * 2, height: s * 2 }}>
        <div className="absolute top-0 right-0" style={{ width: s, height: 2, background: c, boxShadow: `0 0 6px ${c}` }} />
        <div className="absolute top-0 right-0" style={{ width: 2, height: s, background: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
      {/* BL */}
      <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width: s * 2, height: s * 2 }}>
        <div className="absolute bottom-0 left-0" style={{ width: s, height: 2, background: c, boxShadow: `0 0 6px ${c}` }} />
        <div className="absolute bottom-0 left-0" style={{ width: 2, height: s, background: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
      {/* BR */}
      <div className="absolute bottom-0 right-0 pointer-events-none" style={{ width: s * 2, height: s * 2 }}>
        <div className="absolute bottom-0 right-0" style={{ width: s, height: 2, background: c, boxShadow: `0 0 6px ${c}` }} />
        <div className="absolute bottom-0 right-0" style={{ width: 2, height: s, background: c, boxShadow: `0 0 6px ${c}` }} />
      </div>
    </>
  );
}

// ─── Animated scan-line sweep ─────────────────────────────────────────────────

function ScanSweep({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-20"
      style={{ background: `linear-gradient(90deg, transparent, ${color}80, ${color}, ${color}80, transparent)`, boxShadow: `0 0 8px ${color}` }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
    />
  );
}

// ─── Radar pulse ring ─────────────────────────────────────────────────────────

function RadarPulse({ color }: { color: string }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: `1px solid ${color}`, width: 8, height: 8 }}
          animate={{ width: [8, 32], height: [8, 32], opacity: [0.8, 0] }}
          transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}

// ─── HUD stat card ────────────────────────────────────────────────────────────

function HudStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl p-4"
      style={{ background: "linear-gradient(135deg,#060f06,#0a150a)", border: "1px solid #00FF4130" }}>
      <CyberCorners color="#00FF41" size={8} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,65,0.015) 3px,rgba(0,255,65,0.015) 4px)" }} />
      <p className="text-2xl font-black font-mono text-genius-green" style={{ textShadow: "0 0 20px #00FF4180" }}>{value}</p>
      <p className="text-[11px] font-bold text-white tracking-wider mt-0.5 uppercase">{label}</p>
      <p className="text-[10px] text-genius-muted mt-0.5 font-mono">{sub}</p>
    </div>
  );
}

// ─── Live Scanner Section ─────────────────────────────────────────────────────

function LiveScannerSection() {
  const [scanData, setScanData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [scanIdx,  setScanIdx]  = useState(0);
  const [visibleTickers, setVisibleTickers] = useState<string[]>([]);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [tick, setTick]         = useState(0);
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetch("/api/scan-live"); if (r.ok) setScanData(await r.json()); } catch {}
    };
    load(); const iv = setInterval(load, 30000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      try { const r = await fetch("/api/market-news"); if (r.ok) { const d = await r.json(); setNewsData(d.news ?? []); } } catch {}
    };
    loadNews(); const iv = setInterval(loadNews, 60000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setVisibleTickers(UNIVERSE.slice(0, 24));
    const iv = setInterval(() => {
      setScanIdx(prev => {
        const next = (prev + 8) % UNIVERSE.length;
        setVisibleTickers(UNIVERSE.slice(next, next + 24));
        const flash = Math.floor(Math.random() * 24);
        setFlashIdx(flash);
        setTimeout(() => setFlashIdx(null), 700);
        return next;
      });
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!newsRef.current || newsData.length === 0) return;
    const iv = setInterval(() => {
      if (newsRef.current) {
        newsRef.current.scrollTop += 1;
        if (newsRef.current.scrollTop + newsRef.current.clientHeight >= newsRef.current.scrollHeight - 10)
          newsRef.current.scrollTop = 0;
      }
    }, 28);
    return () => clearInterval(iv);
  }, [newsData]);

  const stocksScanned = scanData?.stocksScanned ?? 0;
  const batchesRun    = scanData?.batchesRun ?? 0;
  const signals       = scanData?.recentSignals ?? [];
  const scanPosition  = ((scanIdx / UNIVERSE.length) * 100).toFixed(1);
  const cursor        = tick % 2 === 0 ? "█" : " ";

  return (
    <div className="space-y-4">

      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RadarPulse color="#00FF41" />
          <div>
            <h2 className="text-lg font-black text-white tracking-wide" style={{ textShadow: "0 0 20px #00FF4140" }}>
              LIVE MARKET SCANNER
            </h2>
            <p className="text-[10px] font-mono text-genius-muted tracking-widest">
              SYS:ACTIVE · 6,843 EQUITIES + 6 CRYPTO PAIRS · 24/7/365
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-black"
            style={{ background: "rgba(0,255,65,0.08)", border: "1px solid #00FF4150", color: "#00FF41", textShadow: "0 0 8px #00FF41", letterSpacing: "0.15em" }}>
            <span className="animate-pulse">◉</span> SCANNING{cursor}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid #06B6D430", color: "#06B6D4" }}>
            <Wifi size={10} className="animate-pulse" />
            <span>LIVE FEED</span>
          </div>
        </div>
      </div>

      {/* ── HUD stats ── */}
      <div className="grid grid-cols-4 gap-3">
        <HudStat label="Universe" value="6,843" sub="stocks + 6 crypto" />
        <HudStat label="Batches Run" value={batchesRun > 0 ? batchesRun.toLocaleString() : "—"} sub="100 stocks / batch" />
        <HudStat label="Stocks Scanned" value={stocksScanned > 0 ? stocksScanned.toLocaleString() : "—"} sub="this session" />
        <HudStat label="Signals" value={signals.length.toString()} sub="recent trades" />
      </div>

      {/* ── Scanner + News grid ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left: ticker terminal */}
        <div className="relative rounded-xl overflow-hidden flex flex-col"
          style={{ height: 520, background: "linear-gradient(160deg,#020a02,#040d04)", border: "1px solid #00FF4125" }}>
          <CyberCorners color="#00FF41" size={12} />
          <ScanSweep color="#00FF41" />

          {/* CRT scanlines */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)" }} />

          {/* Header */}
          <div className="relative z-20 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #00FF4120", background: "rgba(0,255,65,0.04)" }}>
            <div className="flex items-center gap-2">
              <Cpu size={12} style={{ color: "#00FF41" }} />
              <span className="text-xs font-black font-mono text-genius-green tracking-wider">SIGNAL ANALYZER</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-genius-muted">
                BATCH <span className="text-genius-green">{Math.floor(scanIdx / 8) + 1}</span>
              </span>
              <span className="text-[10px] font-mono text-genius-muted">
                POS <span className="text-genius-green">{scanPosition}%</span>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-20 h-0.5" style={{ background: "#00FF4110" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg,#00FF41,#00D97E)", boxShadow: "0 0 6px #00FF41, 0 0 12px #00FF4160" }}
              animate={{ width: `${scanPosition}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Ticker grid */}
          <div className="relative z-20 flex-1 p-3 overflow-hidden">
            <div className="grid grid-cols-2 gap-1.5">
              {visibleTickers.map((sym, i) => {
                const rsi   = symRsi(sym);
                const chg   = symChange(sym);
                const isFlash = flashIdx === i;
                const isBull  = rsi >= 55 && chg > 0;
                const isBear  = rsi <= 38 || chg < -1.5;
                return (
                  <motion.div
                    key={`${sym}-${scanIdx}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.015, duration: 0.18 }}
                    className="flex items-center justify-between rounded px-2.5 py-1.5"
                    style={{
                      background: isFlash
                        ? "rgba(0,255,65,0.18)"
                        : isBull ? "rgba(0,255,65,0.05)" : isBear ? "rgba(248,113,113,0.05)" : "rgba(255,255,255,0.02)",
                      border: isFlash
                        ? "1px solid #00FF4170"
                        : `1px solid ${isBull ? "rgba(0,255,65,0.18)" : isBear ? "rgba(248,113,113,0.15)" : "rgba(0,255,65,0.06)"}`,
                      boxShadow: isFlash ? "0 0 12px #00FF4130" : "none",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {isFlash && (
                        <motion.div className="w-1 h-1 rounded-full bg-genius-green"
                          animate={{ scale: [1, 2, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 0.5, repeat: 2 }} />
                      )}
                      <span className="text-xs font-black font-mono"
                        style={{ color: isFlash ? "#00FF41" : isBull ? "#00FF41" : isBear ? "#F87171" : "#7AA87A",
                                 textShadow: isFlash ? "0 0 8px #00FF41" : "none" }}>
                        {sym}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono"
                        style={{ color: rsi >= 55 ? "#00FF41" : rsi <= 38 ? "#F87171" : "#3d7a3d" }}>
                        {rsi}
                      </span>
                      <span className="text-[10px] font-black font-mono"
                        style={{ color: chg >= 0 ? "#00D97E" : "#F87171",
                                 textShadow: chg > 2 ? "0 0 6px #00D97E" : chg < -2 ? "0 0 6px #F87171" : "none" }}>
                        {chg >= 0 ? "+" : ""}{chg}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Signals */}
          {signals.length > 0 && (
            <div className="relative z-20 px-3 py-2.5"
              style={{ borderTop: "1px solid #00FF4118", background: "rgba(0,255,65,0.03)" }}>
              <p className="text-[9px] font-mono tracking-widest mb-1.5"
                style={{ color: "#00FF4180" }}>// RECENT SIGNALS</p>
              <div className="space-y-1">
                {signals.slice(0, 3).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                    <span className={`font-black px-1.5 py-0.5 rounded-sm ${s.action === "BUY" ? "bg-genius-green/20 text-genius-green" : "bg-red-500/20 text-red-400"}`}
                      style={{ textShadow: s.action === "BUY" ? "0 0 6px #00FF41" : "0 0 6px #F87171" }}>
                      {s.action}
                    </span>
                    <span className="text-white font-bold">{s.symbol}</span>
                    <span className="text-genius-muted ml-auto">{s.time?.slice(11, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: news intercept */}
        <div className="relative rounded-xl overflow-hidden flex flex-col"
          style={{ height: 520, background: "linear-gradient(160deg,#020508,#030a0f)", border: "1px solid #06B6D425" }}>
          <CyberCorners color="#06B6D4" size={12} />

          {/* CRT scanlines */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)" }} />

          {/* Header */}
          <div className="relative z-20 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #06B6D420", background: "rgba(6,182,212,0.04)" }}>
            <div className="flex items-center gap-2">
              <Radio size={12} style={{ color: "#06B6D4" }} className="animate-pulse" />
              <span className="text-xs font-black font-mono tracking-wider" style={{ color: "#06B6D4" }}>
                SIGNAL INTERCEPT
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-widest" style={{ color: "#06B6D460" }}>
              LIVE · ∞ FEED
            </span>
          </div>

          <div ref={newsRef} className="relative z-20 flex-1 overflow-hidden px-3 py-2 space-y-1.5">
            {newsData.length === 0 ? (
              <div className="flex items-center justify-center h-full gap-2 text-xs font-mono" style={{ color: "#06B6D4" }}>
                <RefreshCw size={12} className="animate-spin" />
                ACQUIRING SIGNAL…
              </div>
            ) : (
              [...newsData, ...newsData].map((item: any, i: number) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  className="block rounded p-2.5 transition-all hover:bg-white/5 group"
                  style={{ border: "1px solid rgba(6,182,212,0.08)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded-sm flex-shrink-0"
                      style={{
                        background: item.sentiment === "bullish" ? "rgba(0,255,65,0.12)" : item.sentiment === "bearish" ? "rgba(248,113,113,0.12)" : "rgba(6,182,212,0.1)",
                        color: item.sentiment === "bullish" ? "#00FF41" : item.sentiment === "bearish" ? "#F87171" : "#06B6D4",
                        textShadow: item.sentiment === "bullish" ? "0 0 6px #00FF41" : item.sentiment === "bearish" ? "0 0 6px #F87171" : "0 0 6px #06B6D4",
                      }}>
                      {item.symbol}
                    </span>
                    <span className="flex-1 text-xs text-genius-text line-clamp-1 group-hover:text-white transition-colors">
                      {item.title}
                    </span>
                    {item.sentiment === "bullish"
                      ? <ArrowUpRight size={10} className="text-genius-green flex-shrink-0" />
                      : item.sentiment === "bearish"
                      ? <ArrowDownRight size={10} className="text-red-400 flex-shrink-0" />
                      : <Minus size={10} className="flex-shrink-0" style={{ color: "#06B6D4" }} />
                    }
                  </div>
                  <p className="text-[10px] font-mono" style={{ color: "rgba(6,182,212,0.5)" }}>
                    {item.publisher}  ·  {item.publishedAt ? new Date(item.publishedAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function BotsPage() {
  const [active,  setActive]  = useState<Record<string, boolean>>(
    Object.fromEntries(BOTS.map(b => [b.id, b.defaultOn]))
  );
  const [running, setRunning] = useState(false);
  const [runMsg,  setRunMsg]  = useState<string | null>(null);

  const activeBots = BOTS.filter(b => active[b.id]);

  const handleDeploy = async () => {
    setRunning(true); setRunMsg(null);
    const result = await runAutoTrade();
    setRunning(false);
    if (result.error) setRunMsg(result.error);
    else if (result.executed === 0) setRunMsg("No signals met confidence threshold. Try again shortly.");
    else setRunMsg(`Bot executed ${result.executed} trade${result.executed !== 1 ? "s" : ""}. Check your portfolio.`);
    setTimeout(() => setRunMsg(null), 6000);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide" style={{ textShadow: "0 0 30px rgba(0,255,65,0.2)" }}>
          AI Trading Bots
        </h1>
        <p className="text-sm text-genius-muted mt-1">
          Independent AI agents — each with its own strategy, signal engine, and risk profile
        </p>
      </div>

      {/* ── Status strip ── */}
      <div className="relative rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap overflow-hidden"
        style={{ background: "linear-gradient(135deg,#060f06,#080d08)", border: "1px solid #00FF4120" }}>
        <CyberCorners color="#00FF41" size={8} />
        <span className="text-[10px] font-mono text-genius-muted uppercase tracking-widest">Active Bots</span>
        {activeBots.length === 0 ? (
          <span className="text-xs text-genius-muted font-mono italic">No bots active — toggle one below</span>
        ) : (
          activeBots.map(b => (
            <div key={b.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
              <span className="text-xs font-bold font-mono" style={{ color: b.color, textShadow: `0 0 6px ${b.color}60` }}>{b.name}</span>
            </div>
          ))
        )}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-xs font-mono text-genius-green" style={{ letterSpacing: "0.1em" }}>MONITORING</span>
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
        <div className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-mono overflow-hidden ${
          runMsg.includes("executed") ? "border-genius-green/30 bg-genius-green/5 text-genius-green" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
        }`}>
          <CyberCorners color={runMsg.includes("executed") ? "#00FF41" : "#F59E0B"} size={6} />
          {runMsg.includes("executed") ? <CheckCircle size={14} /> : <RefreshCw size={14} />}
          {runMsg}
        </div>
      )}

      {/* ── 2×2 Bot cards ── */}
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
                border: on ? `1px solid ${bot.color}60` : `1px solid ${bot.color}30`,
                boxShadow: on ? `0 0 30px ${bot.color}20, 0 0 60px ${bot.color}08` : "none",
                opacity: on ? 1 : 0.65,
                transition: "all 0.4s ease",
              }}
            >
              {/* Motif background */}
              <div className="absolute inset-0 pointer-events-none" style={motifStyle(bot.motif, bot.color)} />

              {/* Cyber corners */}
              <CyberCorners color={bot.color} size={10} />

              {/* Animated pulse when ON */}
              {on && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  animate={{ opacity: [0.03, 0.08, 0.03] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${bot.color} 0%, transparent 70%)` }}
                />
              )}

              {/* Scan sweep when active */}
              {on && <ScanSweep color={bot.color} />}

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${bot.color}30, ${bot.colorAlt}20)`,
                        border: `1px solid ${bot.color}40`,
                        boxShadow: on ? `0 0 20px ${bot.color}40, inset 0 0 10px ${bot.color}10` : "none",
                      }}>
                      <bot.Icon size={22} style={{ color: bot.color, filter: on ? `drop-shadow(0 0 6px ${bot.color})` : "none" }} />
                    </div>
                    <div>
                      <h2 className="font-black text-white text-base leading-tight">{bot.name}</h2>
                      <p className="text-xs font-mono" style={{ color: bot.colorAlt }}>{bot.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black font-mono"
                    style={{
                      background: on ? `${bot.color}20` : "rgba(255,255,255,0.05)",
                      border: on ? `1px solid ${bot.color}50` : "1px solid rgba(255,255,255,0.1)",
                      color: on ? bot.color : "#4A7A4A",
                      textShadow: on ? `0 0 8px ${bot.color}` : "none",
                    }}>
                    {on ? (
                      <><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: bot.color }} />ACTIVE</>
                    ) : (
                      <><div className="w-1.5 h-1.5 rounded-full bg-genius-muted" />STANDBY</>
                    )}
                  </div>
                </div>

                <p className="text-xs text-genius-text leading-relaxed mb-4">{bot.description}</p>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {bot.stats.map(s => (
                    <div key={s.label} className="rounded-lg px-2 py-2 text-center relative overflow-hidden"
                      style={{ background: `${bot.color}08`, border: `1px solid ${bot.color}20` }}>
                      <p className="text-sm font-black font-mono"
                        style={{
                          color: s.up === true ? bot.color : s.up === false ? "#F87171" : "#fff",
                          textShadow: s.up === true ? `0 0 8px ${bot.color}80` : s.up === false ? "0 0 8px #F8717180" : "none",
                        }}>
                        {s.value}
                      </p>
                      <p className="text-[10px] text-genius-muted mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex-1" />

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${bot.color}20` }}>
                  <button onClick={() => setActive(prev => ({ ...prev, [bot.id]: !prev[bot.id] }))}
                    className="flex items-center gap-2 transition-all">
                    {on
                      ? <ToggleRight size={28} style={{ color: bot.color, filter: `drop-shadow(0 0 4px ${bot.color})` }} />
                      : <ToggleLeft size={28} className="text-genius-muted" />
                    }
                    <span className="text-xs font-bold font-mono"
                      style={{ color: on ? bot.color : "#4A7A4A", textShadow: on ? `0 0 6px ${bot.color}` : "none" }}>
                      {on ? "ON" : "OFF"}
                    </span>
                  </button>
                  <Link href={bot.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all hover:opacity-80"
                    style={{ background: `${bot.color}18`, border: `1px solid ${bot.color}40`, color: bot.color }}>
                    Open Bot <ChevronRight size={12} />
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
      <div className="relative rounded-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#060f06,#04090a)", border: "1px solid #00FF4115" }}>
        <CyberCorners color="#00FF41" size={10} />
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #00FF4115" }}>
          <BarChart2 size={16} className="text-genius-green" style={{ filter: "drop-shadow(0 0 4px #00FF41)" }} />
          <h2 className="font-bold text-white tracking-wide">Bot Comparison</h2>
          <span className="text-xs text-genius-muted font-mono ml-1">— all strategies side by side</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #00FF4115" }}>
                <th className="text-left px-5 py-3 text-xs text-genius-muted font-mono uppercase tracking-wider">Metric</th>
                {BOTS.map(b => (
                  <th key={b.id} className="px-4 py-3 text-xs font-mono uppercase" style={{ color: b.color, textShadow: `0 0 8px ${b.color}60` }}>
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
                <tr key={key} className="border-b border-genius-border/30 hover:bg-genius-green/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-genius-muted" />
                      <span className="text-xs text-genius-muted font-mono">{label}</span>
                    </div>
                  </td>
                  {BOTS.map(b => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <span className="text-xs font-mono text-genius-text">{(b.comparison as any)[key]}</span>
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
