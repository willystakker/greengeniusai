"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper, RefreshCw, TrendingUp, TrendingDown, Brain,
  ExternalLink, Search, Clock, Wifi,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";

type NewsItem = {
  title: string; publisher: string; link: string;
  publishedAt: number; thumbnail: string | null;
  score: number; sentiment: "bullish" | "bearish" | "neutral";
  sym: string;
};

// Broad market symbols always scanned
const MARKET_SYMS = ["NVDA","TSLA","AMZN","GOOGL","MSFT","AAPL","META","AMD","SPY","QQQ"];

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NewsPage() {
  const [allNews,  setAllNews]  = useState<NewsItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [filter,   setFilter]   = useState<"all"|"bullish"|"bearish"|"portfolio">("all");
  const [search,   setSearch]   = useState("");
  const [scanning, setScanning] = useState(false);
  const { open: openChart } = useTickerChart();

  const portfolio = useRealPortfolio(30000);
  const portfolioSyms = portfolio.positions.map(p => p.sym);

  // Combine portfolio symbols with market standards, dedupe
  const allSyms = [...new Set([...portfolioSyms, ...MARKET_SYMS])];

  const scanNews = useCallback(async () => {
    if (allSyms.length === 0) return;
    setScanning(true);
    try {
      const results = await Promise.all(
        allSyms.map(async sym => {
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
      const unique = flat.filter(n => { if (seen.has(n.title)) return false; seen.add(n.title); return true; });
      unique.sort((a, b) => b.publishedAt - a.publishedAt);
      setAllNews(unique);
      setLastScan(new Date());
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [allSyms.join(",")]);

  useEffect(() => {
    if (allSyms.length > 0) {
      scanNews();
      const iv = setInterval(scanNews, 60000);
      return () => clearInterval(iv);
    }
  }, [scanNews]);

  const filtered = allNews.filter(n => {
    if (filter === "bullish"   && n.sentiment !== "bullish")  return false;
    if (filter === "bearish"   && n.sentiment !== "bearish")  return false;
    if (filter === "portfolio" && !portfolioSyms.includes(n.sym)) return false;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center">
              <Newspaper size={18} className="text-genius-green" />
            </div>
            AI News Scanner
          </h1>
          <p className="text-xs text-genius-muted font-mono mt-1 flex items-center gap-2">
            {scanning ? (
              <><RefreshCw size={11} className="animate-spin text-genius-green" /><span className="text-genius-green">Scanning {allSyms.length} symbols…</span></>
            ) : (
              <><div className="live-dot" /><span>Live scan · {allSyms.length} symbols · every 60s</span></>
            )}
            {portfolioSyms.length > 0 && <span className="text-genius-green">· {portfolioSyms.length} portfolio positions</span>}
            {lastScan && <span>· Last: {lastScan.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={scanNews} disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold disabled:opacity-60">
          <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning…" : "Scan Now"}
        </button>
      </div>

      {/* KPI strip */}
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

      {/* AI sentiment banner */}
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
                {portfolioHits > 0 && `${portfolioHits} news items directly affect your ${portfolioSyms.length} portfolio positions.`}
                {portfolioSyms.length === 0 && "No open positions yet — bot will open positions Tuesday when market opens."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-genius-muted flex-shrink-0">
              <Clock size={10} />
              {lastScan?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Filter + search */}
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
                  ? f === "bullish" ? "bg-genius-green/15 text-genius-green"
                    : f === "bearish" ? "bg-red-500/15 text-red-400"
                    : f === "portfolio" ? "bg-genius-emerald/15 text-genius-emerald"
                    : "bg-genius-green/15 text-genius-green"
                  : "text-genius-muted hover:text-white"
              }`}>{f === "portfolio" ? "My Portfolio" : f}</button>
          ))}
        </div>
        <span className="text-xs text-genius-muted font-mono">{filtered.length} articles</span>
      </div>

      {/* Symbol chips */}
      <div className="flex flex-wrap gap-2">
        {allSyms.map(sym => {
          const count      = allNews.filter(n => n.sym === sym).length;
          const inPortfolio = portfolioSyms.includes(sym);
          return (
            <button key={sym} onClick={() => openChart(sym)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border hover:border-genius-green/40 hover:bg-genius-card transition-all text-xs font-mono"
              style={{ borderColor: inPortfolio ? "rgba(0,255,65,0.3)" : "rgba(255,255,255,0.1)" }}>
              <span className={`font-bold ${inPortfolio ? "text-genius-green" : "text-white"}`}>{sym}</span>
              {inPortfolio && <span className="text-[9px] text-genius-green/60">●</span>}
              {count > 0 && <span className="text-[10px] font-bold text-genius-green">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* News feed */}
      {loading ? (
        <div className="genius-card rounded-xl p-8 flex flex-col items-center justify-center gap-4 border border-genius-border">
          <RefreshCw size={28} className="animate-spin text-genius-green" />
          <p className="text-sm text-genius-muted font-mono">Scanning {allSyms.length} symbols for news…</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {allSyms.map(s => <span key={s} className="text-xs font-mono text-genius-green animate-pulse">{s}</span>)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="genius-card rounded-xl p-8 text-center border border-genius-border">
          <p className="text-genius-muted font-mono text-sm">No articles match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item, i) => (
            <div key={i} className={`genius-card rounded-xl border transition-all hover:border-genius-green/20 ${
              item.sentiment === "bullish" ? "border-genius-green/10 bg-genius-green/2" :
              item.sentiment === "bearish" ? "border-red-500/10 bg-red-500/2" :
              "border-genius-border"
            }`}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
