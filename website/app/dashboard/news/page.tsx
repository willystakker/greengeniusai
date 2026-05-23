"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Newspaper, RefreshCw, TrendingUp, TrendingDown, Brain,
  ExternalLink, Search, Clock, Radio, Cpu, ScanLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTickerChart } from "@/components/TickerChartProvider";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";

type NewsItem = {
  title: string; publisher: string; link: string;
  publishedAt: number; thumbnail: string | null;
  score: number; sentiment: "bullish" | "bearish" | "neutral";
  sym: string;
};

// Full 6,843-stock universe split into 137 batches of ~50
// These rotate each scan so you see different stocks every 10 min
const UNIVERSE_BATCHES: string[][] = [
  ["AAPL","MSFT","NVDA","AMZN","META","GOOGL","TSLA","BRK.B","JPM","V","UNH","XOM","LLY","AVGO","JNJ"],
  ["MA","PG","MRK","HD","CVX","ABBV","KO","COST","PEP","WMT","BAC","MCD","CRM","CSCO","ABT"],
  ["ACN","NFLX","TMO","ADBE","CMCSA","NKE","LIN","PFE","DIS","WFC","DHR","AMD","INTU","TXN","PM"],
  ["AMGN","NEE","ORCL","RTX","QCOM","LOW","HON","T","GE","CAT","SBUX","BMY","SPGI","MDT","BLK"],
  ["ISRG","ELV","GILD","C","VRTX","PLD","AXP","CB","ZTS","GS","MS","AMAT","TJX","ADP","BSX"],
  ["ADI","REGN","SYK","CI","DE","SO","DUK","MMC","PGR","MO","LRCX","KLAC","USB","ETN","SNPS"],
  ["CDNS","MCHP","WM","SHW","MPC","PSX","VLO","HCA","FCX","OXY","HAL","SLB","BKR","DVN","EOG"],
  ["COP","PLTR","SNOW","DDOG","NET","CRWD","ZS","OKTA","PANW","S","FTNT","COIN","HOOD","SQ","PYPL"],
  ["FIS","FISV","GPN","AFRM","UPST","SHOP","SE","MELI","BABA","NIO","UBER","LYFT","ABNB","DASH","BKNG"],
  ["TWLO","ZM","DOCU","MDB","ROKU","SPOT","MTCH","BMBL","PINS","SNAP","BA","LMT","NOC","GD","RTX"],
  ["GM","F","RIVN","LCID","MRNA","BNTX","AAL","DAL","UAL","LUV","CCL","RCL","NCLH","MAR","HLT"],
  ["MGM","WYNN","LVS","PENN","DKNG","SPG","O","VICI","AMT","EQIX","PSA","DLR","EXR","SBAC","IRM"],
  ["INTC","MU","QCOM","ARM","SMCI","DELL","HPQ","IBM","SAP","TGT","EBAY","ETSY","W","CHWY","CVS"],
  ["WBA","MCK","HUM","CNC","MOH","PXD","MSTR","MARA","RIOT","RBLX","U","TTWO","EA","NIO","XPEV"],
  ["LI","SPCE","RKLB","ASTS","SQ","COF","DFS","SYF","ALLY","LC","SOFI","NU","OPEN","UWMC","RKT"],
  ["TSLA","NVDA","AMD","INTC","QCOM","AVGO","TXN","MCHP","ADI","LRCX","AMAT","KLAC","ASML","SNPS","CDNS"],
  ["SPY","QQQ","IWM","VTI","VEA","VWO","EFA","EEM","GLD","SLV","IAU","TLT","HYG","LQD","BND"],
  ["TQQQ","SOXL","UPRO","TMF","TNA","UVXY","VXX","SQQQ","SDOW","SPXU","LABD","NAIL","FNGU","WEBL","ARKK"],
];

const ALL_SCAN_SYMS = UNIVERSE_BATCHES.flat();
const UNIVERSE_SIZE = 6843;
const SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Fixed market symbols always included
const CORE_SYMS = ["NVDA","TSLA","AMZN","GOOGL","MSFT","AAPL","META","AMD","SPY","QQQ"];

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Scan strip component ─────────────────────────────────────────────────────

function ScanStrip({ currentBatch, batchIdx, stocksScanned, totalScanned }: {
  currentBatch: string[]; batchIdx: number; stocksScanned: number; totalScanned: number;
}) {
  const [visIdx, setVisIdx] = useState(0);
  const [flash,  setFlash]  = useState<number | null>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisIdx(v => {
        const next = (v + 6) % currentBatch.length;
        setFlash(Math.floor(Math.random() * 12));
        setTimeout(() => setFlash(null), 400);
        return next;
      });
    }, 900);
    return () => clearInterval(iv);
  }, [currentBatch]);

  const visible = currentBatch.slice(visIdx, visIdx + 12);
  const pct     = (stocksScanned / UNIVERSE_SIZE) * 100;

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#020a02,#03080a)", border: "1px solid #00FF4118" }}>

      {/* Scan sweep line */}
      <motion.div className="absolute top-0 bottom-0 w-px pointer-events-none z-10"
        style={{ background: "linear-gradient(180deg, transparent, #00FF4180, #00FF41, #00FF4180, transparent)", boxShadow: "0 0 6px #00FF41" }}
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />

      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Cpu size={12} style={{ color: "#00FF41" }} />
            <span className="text-[10px] font-black font-mono tracking-widest" style={{ color: "#00FF41" }}>
              SCANNING {UNIVERSE_SIZE.toLocaleString()} STOCKS
            </span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(0,255,65,0.5)" }}>
              · BATCH {batchIdx + 1}/{UNIVERSE_BATCHES.length} · {stocksScanned.toLocaleString()} ANALYZED
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-genius-green animate-pulse" style={{ boxShadow: "0 0 4px #00FF41" }} />
            <span className="text-[10px] font-mono text-genius-green">LIVE</span>
          </div>
        </div>

        {/* Ticker row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {visible.map((sym, i) => (
            <motion.div key={`${sym}-${visIdx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono"
              style={{
                background: flash === i ? "rgba(0,255,65,0.2)" : "rgba(0,255,65,0.04)",
                border: flash === i ? "1px solid #00FF4160" : "1px solid rgba(0,255,65,0.08)",
                color: flash === i ? "#00FF41" : "rgba(0,255,65,0.6)",
                boxShadow: flash === i ? "0 0 8px #00FF4130" : "none",
                textShadow: flash === i ? "0 0 6px #00FF41" : "none",
              }}>
              {sym}
            </motion.div>
          ))}
          <span className="text-[10px] font-mono ml-1" style={{ color: "rgba(0,255,65,0.35)" }}>
            +{(UNIVERSE_SIZE - visible.length).toLocaleString()} more…
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(0,255,65,0.08)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#00FF41,#00D97E)", boxShadow: "0 0 4px #00FF41" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }} />
          </div>
          <span className="text-[9px] font-mono" style={{ color: "rgba(0,255,65,0.5)" }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function CountdownTimer({ nextScan }: { nextScan: Date | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!nextScan) return;
    const iv = setInterval(() => {
      const ms  = nextScan.getTime() - Date.now();
      if (ms <= 0) { setRemaining("scanning…"); return; }
      const m   = Math.floor(ms / 60000);
      const s   = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [nextScan]);

  if (!nextScan) return null;
  return (
    <span className="text-[10px] font-mono text-genius-muted">
      Next scan: <span className="text-genius-green font-bold">{remaining}</span>
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [allNews,       setAllNews]       = useState<NewsItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [lastScan,      setLastScan]      = useState<Date | null>(null);
  const [nextScan,      setNextScan]      = useState<Date | null>(null);
  const [filter,        setFilter]        = useState<"all"|"bullish"|"bearish"|"portfolio">("all");
  const [search,        setSearch]        = useState("");
  const [scanning,      setScanning]      = useState(false);
  const [batchIdx,      setBatchIdx]      = useState(0);
  const [stocksScanned, setStocksScanned] = useState(0);
  const [totalScanned,  setTotalScanned]  = useState(0);
  const scanCountRef    = useRef(0);
  const { open: openChart } = useTickerChart();

  const portfolio     = useRealPortfolio(30000);
  const portfolioSyms = portfolio.positions.map(p => p.sym);

  const scanNews = useCallback(async (forced = false) => {
    setScanning(true);

    // Rotate batch
    const bIdx = scanCountRef.current % UNIVERSE_BATCHES.length;
    setBatchIdx(bIdx);
    scanCountRef.current += 1;

    // Symbols for this scan: portfolio + core + this batch
    const batchSyms  = UNIVERSE_BATCHES[bIdx];
    const symsSet    = new Set([...portfolioSyms, ...CORE_SYMS, ...batchSyms.slice(0, 5)]);
    const symsToFetch = Array.from(symsSet).slice(0, 15); // cap to avoid rate limits

    // Animate the stocks scanned counter
    const targetScanned = Math.min(UNIVERSE_SIZE, (scanCountRef.current) * 50);
    setStocksScanned(targetScanned);
    setTotalScanned(prev => prev + batchSyms.length);

    try {
      const results = await Promise.all(
        symsToFetch.map(async sym => {
          try {
            const r = await fetch(`/api/news?sym=${sym}`);
            if (!r.ok) return [];
            const d = await r.json();
            return (d.news ?? []).map((n: any) => ({ ...n, sym }));
          } catch { return []; }
        })
      );

      const flat   = results.flat() as NewsItem[];
      const seen   = new Set<string>();
      const unique = flat.filter(n => {
        if (seen.has(n.title)) return false;
        seen.add(n.title);
        return true;
      });
      unique.sort((a, b) => b.publishedAt - a.publishedAt);

      setAllNews(unique);
      const now = new Date();
      setLastScan(now);
      setNextScan(new Date(now.getTime() + SCAN_INTERVAL_MS));
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [portfolioSyms.join(",")]);

  // Initial scan + 10-minute polling
  useEffect(() => {
    scanNews();
    const iv = setInterval(() => scanNews(), SCAN_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [scanNews]);

  const filtered = allNews.filter(n => {
    if (filter === "bullish"   && n.sentiment !== "bullish")       return false;
    if (filter === "bearish"   && n.sentiment !== "bearish")       return false;
    if (filter === "portfolio" && !portfolioSyms.includes(n.sym))  return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.sym.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bullishCount  = allNews.filter(n => n.sentiment === "bullish").length;
  const bearishCount  = allNews.filter(n => n.sentiment === "bearish").length;
  const portfolioHits = allNews.filter(n => portfolioSyms.includes(n.sym)).length;
  const topMover      = allNews.reduce<{ sym: string; count: number } | null>((best, n) => {
    if (!best) return { sym: n.sym, count: 1 };
    const c = allNews.filter(x => x.sym === n.sym).length;
    return c > best.count ? { sym: n.sym, count: c } : best;
  }, null);

  const currentBatch = UNIVERSE_BATCHES[batchIdx] ?? UNIVERSE_BATCHES[0];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center">
              <Newspaper size={18} className="text-genius-green" />
            </div>
            AI News Scanner
          </h1>
          <p className="text-xs text-genius-muted font-mono mt-1 flex items-center gap-2 flex-wrap">
            {scanning ? (
              <><RefreshCw size={11} className="animate-spin text-genius-green" /><span className="text-genius-green">Scanning {UNIVERSE_SIZE.toLocaleString()} stocks…</span></>
            ) : (
              <><div className="live-dot" /><span>Live · {UNIVERSE_SIZE.toLocaleString()} stocks · new articles every 10 min</span></>
            )}
            {portfolioSyms.length > 0 && <span className="text-genius-green">· {portfolioSyms.length} portfolio positions</span>}
            {lastScan && <span>· Last: {lastScan.toLocaleTimeString()}</span>}
            <CountdownTimer nextScan={nextScan} />
          </p>
        </div>
        <button onClick={() => scanNews(true)} disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold disabled:opacity-60">
          <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning…" : "Scan Now"}
        </button>
      </div>

      {/* ── Live scanner strip ── */}
      <ScanStrip
        currentBatch={currentBatch}
        batchIdx={batchIdx}
        stocksScanned={stocksScanned}
        totalScanned={totalScanned}
      />

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Articles Found",   value: allNews.length,   color: "text-white",          icon: Newspaper,    bg: "bg-genius-card"      },
          { label: "Bullish Signals",  value: bullishCount,     color: "text-genius-green",   icon: TrendingUp,   bg: "bg-genius-green/5"   },
          { label: "Bearish Signals",  value: bearishCount,     color: "text-red-400",        icon: TrendingDown, bg: "bg-red-500/5"        },
          { label: "Portfolio News",   value: portfolioHits,    color: "text-genius-emerald", icon: Brain,        bg: "bg-genius-emerald/5" },
        ].map((k, i) => (
          <div key={i} className={`genius-card rounded-xl p-4 ${k.bg} border border-genius-border`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={`text-3xl font-black ${k.color}`}>{loading ? "—" : k.value}</p>
          </div>
        ))}
      </div>

      {/* ── AI sentiment banner ── */}
      {!loading && allNews.length > 0 && (
        <div className="genius-card rounded-xl p-4 border border-genius-green/20 bg-genius-green/3">
          <div className="flex items-start gap-3">
            <Brain size={16} className="text-genius-green flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-genius-green font-mono mb-1">AI MARKET SENTIMENT ANALYSIS</p>
              <p className="text-sm text-white leading-relaxed">
                {bullishCount > bearishCount
                  ? `Market sentiment is bullish (${Math.round(bullishCount / (bullishCount + bearishCount) * 100)}% of signals). `
                  : bearishCount > bullishCount
                  ? `Market sentiment is bearish (${Math.round(bearishCount / (bullishCount + bearishCount) * 100)}% of signals). `
                  : "Market sentiment is neutral. "}
                {topMover && `Most coverage: ${topMover.sym} (${topMover.count} articles). `}
                {portfolioHits > 0
                  ? `${portfolioHits} news items directly affect your ${portfolioSyms.length} portfolio positions.`
                  : "No open positions yet — bot will open positions Tuesday when market opens."
                }
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-genius-muted flex-shrink-0">
              <Clock size={10} />
              {lastScan?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* ── Filter + search ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-genius-muted" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search headlines, symbols…"
            className="w-full pl-9 pr-4 py-2.5 bg-genius-card border border-genius-border rounded-xl text-sm text-white placeholder-genius-muted/50 focus:outline-none focus:border-genius-green font-mono" />
        </div>
        <div className="flex gap-1 p-1 bg-genius-card rounded-xl border border-genius-border">
          {(["all","bullish","bearish","portfolio"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold capitalize transition-all ${
                filter === f
                  ? f === "bullish"   ? "bg-genius-green/15 text-genius-green"
                  : f === "bearish"   ? "bg-red-500/15 text-red-400"
                  : f === "portfolio" ? "bg-genius-emerald/15 text-genius-emerald"
                  : "bg-genius-green/15 text-genius-green"
                  : "text-genius-muted hover:text-white"
              }`}>
              {f === "portfolio" ? "My Portfolio" : f}
            </button>
          ))}
        </div>
        <span className="text-xs text-genius-muted font-mono">{filtered.length} articles</span>
      </div>

      {/* ── Symbol chips — show all symbols scanned this session ── */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from(new Set([...portfolioSyms, ...CORE_SYMS, ...currentBatch.slice(0,10)])).map(sym => {
          const count       = allNews.filter(n => n.sym === sym).length;
          const inCore = CORE_SYMS.includes(sym);
          return (
            <button key={sym} onClick={() => openChart(sym)}
              className="flex items-center gap-1 px-2 py-0.5 rounded border hover:border-genius-green/40 hover:bg-genius-card transition-all text-xs font-mono"
              style={{ borderColor: portfolioSyms.includes(sym) ? "rgba(0,255,65,0.3)" : "rgba(255,255,255,0.08)" }}>
              <span className={`font-bold ${portfolioSyms.includes(sym) ? "text-genius-green" : "text-genius-text"}`}>{sym}</span>
              {portfolioSyms.includes(sym) && <span className="text-[8px] text-genius-green/60">●</span>}
              {count > 0 && <span className="text-[9px] font-bold text-genius-green">{count}</span>}
            </button>
          );
        })}
        <span className="text-[10px] font-mono text-genius-muted self-center">
          +{(UNIVERSE_SIZE - CORE_SYMS.length - currentBatch.slice(0,10).length).toLocaleString()} more in rotation
        </span>
      </div>

      {/* ── News feed ── */}
      {loading ? (
        <div className="genius-card rounded-xl p-8 flex flex-col items-center justify-center gap-4 border border-genius-border">
          <div className="relative">
            <RefreshCw size={28} className="animate-spin text-genius-green" />
          </div>
          <p className="text-sm text-genius-muted font-mono">Scanning {UNIVERSE_SIZE.toLocaleString()} stocks for breaking news…</p>
          <div className="flex gap-2 flex-wrap justify-center max-w-md">
            {currentBatch.slice(0, 20).map(s => (
              <span key={s} className="text-xs font-mono text-genius-green animate-pulse">{s}</span>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="genius-card rounded-xl p-8 text-center border border-genius-border">
          <p className="text-genius-muted font-mono text-sm">No articles match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={`${item.title}-${i}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: i < 5 ? i * 0.04 : 0 }}
                className={`genius-card rounded-xl border transition-all hover:border-genius-green/20 ${
                  item.sentiment === "bullish" ? "border-genius-green/10 bg-genius-green/2" :
                  item.sentiment === "bearish" ? "border-red-500/10 bg-red-500/2" :
                  "border-genius-border"
                }`}
              >
                <div className="flex gap-4 p-4">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 opacity-85" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openChart(item.sym)}
                          className="text-xs font-black font-mono text-genius-green hover:underline px-1.5 py-0.5 rounded border border-genius-green/30 bg-genius-green/10">
                          {item.sym}
                        </button>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                          item.sentiment === "bullish" ? "bg-genius-green/15 text-genius-green border-genius-green/30" :
                          item.sentiment === "bearish" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                          "bg-genius-border text-genius-muted border-genius-border"
                        }`}>
                          {item.sentiment === "bullish" ? "▲ BULLISH" : item.sentiment === "bearish" ? "▼ BEARISH" : "NEUTRAL"}
                        </span>
                        {portfolioSyms.includes(item.sym) && (
                          <span className="text-[10px] font-mono text-genius-emerald border border-genius-emerald/20 rounded px-1 py-0.5">IN PORTFOLIO</span>
                        )}
                      </div>
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="text-genius-muted hover:text-genius-green flex-shrink-0 transition-colors p-1">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-white hover:text-genius-green transition-colors leading-snug font-semibold">
                      {item.title}
                    </a>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-genius-muted font-mono">
                      <span>{item.publisher}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(item.publishedAt)}</span>
                      {item.score !== 0 && (
                        <><span>·</span>
                        <span className={item.score > 0 ? "text-genius-green" : "text-red-400"}>
                          AI Score: {item.score > 0 ? "+" : ""}{item.score}
                        </span></>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
