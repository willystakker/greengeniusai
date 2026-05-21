"use client";

import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from "react";
import {
  X, TrendingUp, TrendingDown, RefreshCw, BarChart2,
  Newspaper, ArrowUpRight, ArrowDownRight, ShoppingCart,
  CandlestickChart, LineChart, AreaChart as AreaIcon,
  Activity, Bell, Star, ExternalLink, AlertTriangle,
} from "lucide-react";
import TvChart, { type OhlcQuote, type ChartType, type Indicator } from "./TvChart";

// ─── Context ──────────────────────────────────────────────────────────────────
type Ctx = { open: (sym: string) => void; close: () => void };
const ChartCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export function useTickerChart() { return useContext(ChartCtx); }

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab   = "chart" | "news" | "trade";
type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";
type OrderSide = "BUY" | "SELL";
type OrderType = "market" | "limit" | "stop";

type ChartData = {
  sym: string; name: string; price: number; changePct: number;
  open?: number; high?: number; low?: number; volume?: number; marketCap?: number;
  fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number;
  trailingPE?: number; dividendYield?: number; analystRating?: string;
  quotes: OhlcQuote[];
};

type NewsItem = {
  title: string; publisher: string; link: string;
  publishedAt: number; thumbnail: string | null;
  score: number; sentiment: "bullish" | "bearish" | "neutral";
};

function fmt(n?: number, dec = 2) {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
}

function fmtVol(n?: number) {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Indicator button ─────────────────────────────────────────────────────────
function IndBtn({ label, active, onClick, color = "#00FF41" }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
        active
          ? "border-current text-current bg-current/10"
          : "border-genius-border text-genius-muted hover:text-white hover:border-genius-border"
      }`}
      style={active ? { color, borderColor: color } : {}}
    >
      {label}
    </button>
  );
}

// ─── Chart modal ──────────────────────────────────────────────────────────────
function ChartModal({ sym, onClose }: { sym: string; onClose: () => void }) {
  const [tab,        setTab]        = useState<Tab>("chart");
  const [range,      setRange]      = useState<Range>("1M");
  const [chartType,  setChartType]  = useState<ChartType>("candlestick");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [data,       setData]       = useState<ChartData | null>(null);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [newsLoading,setNewsLoading]= useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [orderSide,  setOrderSide]  = useState<OrderSide>("BUY");
  const [orderType,  setOrderType]  = useState<OrderType>("market");
  const [orderQty,   setOrderQty]   = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderDone,  setOrderDone]  = useState(false);
  const [watchlisted,setWatchlisted]= useState(false);

  // Load chart data
  const loadChart = useCallback(async (s: string, r: Range) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/chart?sym=${encodeURIComponent(s)}&range=${r}`);
      if (!res.ok) throw new Error("Fetch failed");
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Load news
  const loadNews = useCallback(async (s: string) => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/news?sym=${encodeURIComponent(s)}`);
      if (!res.ok) return;
      const d = await res.json();
      setNews(d.news ?? []);
    } catch {} finally { setNewsLoading(false); }
  }, []);

  useEffect(() => { loadChart(sym, range); }, [sym, range, loadChart]);
  useEffect(() => { if (tab === "news") loadNews(sym); }, [sym, tab, loadNews]);

  // Auto-refresh chart every 60s
  useEffect(() => {
    const iv = setInterval(() => loadChart(sym, range), 60000);
    return () => clearInterval(iv);
  }, [sym, range, loadChart]);

  // Auto-refresh news every 60s
  useEffect(() => {
    if (tab !== "news") return;
    const iv = setInterval(() => loadNews(sym), 60000);
    return () => clearInterval(iv);
  }, [sym, tab, loadNews]);

  // ESC key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const up    = (data?.changePct ?? 0) >= 0;
  const color = up ? "#00FF41" : "#FF4444";

  const toggleIndicator = (ind: Indicator) =>
    setIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);

  const handleOrder = () => {
    setOrderDone(true);
    setTimeout(() => setOrderDone(false), 3000);
  };

  const sentimentCounts = { bullish: news.filter(n => n.sentiment === "bullish").length, bearish: news.filter(n => n.sentiment === "bearish").length };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#090e09", border: "1px solid #1a2a1a", maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-genius-border/40 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={22} className="text-genius-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black text-white font-mono">{sym}</span>
                {data && (
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                    up ? "bg-genius-green/15 text-genius-green border-genius-green/30"
                       : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}>
                    {up ? "+" : ""}{data.changePct.toFixed(2)}%
                  </span>
                )}
                {data?.analystRating && (
                  <span className="text-[10px] font-mono text-genius-muted border border-genius-border rounded px-1.5 py-0.5">
                    {data.analystRating}
                  </span>
                )}
              </div>
              {data && <p className="text-xs text-genius-muted mt-0.5 font-mono">{data.name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <div className="text-right">
                <p className="text-3xl font-black font-mono" style={{ color }}>{fmt(data.price)}</p>
                <p className={`text-xs font-mono ${up ? "text-genius-green" : "text-red-400"}`}>
                  {up ? "▲" : "▼"} {fmt(Math.abs((data.price ?? 0) * (data.changePct ?? 0) / 100))} today
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setWatchlisted(w => !w)}
                className={`p-2 rounded-lg border transition-colors ${watchlisted ? "border-yellow-400/40 text-yellow-400 bg-yellow-400/10" : "border-genius-border/50 text-genius-muted hover:text-yellow-400"}`}
                title="Watchlist"
              >
                <Star size={14} fill={watchlisted ? "currentColor" : "none"} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg border border-genius-border/50 text-genius-muted hover:text-white hover:border-genius-green/40 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Key stats strip ── */}
        {data && !loading && (
          <div className="grid grid-cols-7 gap-0 border-b border-genius-border/30 flex-shrink-0">
            {[
              { label: "OPEN",    value: fmt(data.open) },
              { label: "HIGH",    value: fmt(data.high) },
              { label: "LOW",     value: fmt(data.low) },
              { label: "VOLUME",  value: fmtVol(data.volume) },
              { label: "MKT CAP", value: fmt(data.marketCap) },
              { label: "52W HIGH",value: fmt(data.fiftyTwoWeekHigh) },
              { label: "52W LOW", value: fmt(data.fiftyTwoWeekLow) },
            ].map(s => (
              <div key={s.label} className="text-center py-2.5 border-r border-genius-border/20 last:border-r-0">
                <p className="text-[9px] text-genius-muted font-mono">{s.label}</p>
                <p className="text-xs font-black text-white font-mono mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-0 border-b border-genius-border/30 flex-shrink-0">
          {([
            { key: "chart", label: "Chart",       icon: CandlestickChart },
            { key: "news",  label: "News",         icon: Newspaper },
            { key: "trade", label: "Trade",        icon: Activity },
          ] as { key: Tab; label: string; icon: any }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono transition-all border-b-2 ${
                tab === t.key
                  ? "text-genius-green border-genius-green"
                  : "text-genius-muted border-transparent hover:text-white"
              }`}
            >
              <t.icon size={13} />
              {t.label}
              {t.key === "news" && news.length > 0 && (
                <span className="w-4 h-4 bg-genius-green text-genius-black text-[9px] font-black rounded-full flex items-center justify-center ml-1">
                  {news.length}
                </span>
              )}
            </button>
          ))}

          {/* Range + chart controls — only shown on chart tab */}
          {tab === "chart" && (
            <div className="ml-auto flex items-center gap-1 pr-4">
              {(["1D","1W","1M","3M","1Y","5Y"] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all ${
                    range === r ? "bg-genius-green text-genius-black" : "text-genius-muted hover:text-white"
                  }`}
                >{r}</button>
              ))}
              <div className="w-px h-4 bg-genius-border/50 mx-1" />
              <button onClick={() => setChartType("candlestick")} title="Candlestick"
                className={`p-1.5 rounded transition-colors ${chartType==="candlestick" ? "text-genius-green" : "text-genius-muted hover:text-white"}`}>
                <CandlestickChart size={14} />
              </button>
              <button onClick={() => setChartType("line")} title="Line"
                className={`p-1.5 rounded transition-colors ${chartType==="line" ? "text-genius-green" : "text-genius-muted hover:text-white"}`}>
                <LineChart size={14} />
              </button>
              <button onClick={() => setChartType("area")} title="Area"
                className={`p-1.5 rounded transition-colors ${chartType==="area" ? "text-genius-green" : "text-genius-muted hover:text-white"}`}>
                <AreaIcon size={14} />
              </button>
              <div className="w-px h-4 bg-genius-border/50 mx-1" />
              {loading && <RefreshCw size={11} className="animate-spin text-genius-green" />}
              <span className="w-1.5 h-1.5 rounded-full bg-genius-green animate-pulse" />
            </div>
          )}
        </div>

        {/* ── Tab: Chart ── */}
        {tab === "chart" && (
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Indicator controls */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-genius-border/20 flex-wrap">
              <span className="text-[10px] text-genius-muted font-mono mr-1">INDICATORS</span>
              <IndBtn label="MA 20"   active={indicators.includes("MA20")}  onClick={() => toggleIndicator("MA20")}  color="#FFD700" />
              <IndBtn label="MA 50"   active={indicators.includes("MA50")}  onClick={() => toggleIndicator("MA50")}  color="#38BDF8" />
              <IndBtn label="BB"      active={indicators.includes("BB")}    onClick={() => toggleIndicator("BB")}    color="#C084FC" />
              <IndBtn label="RSI"     active={indicators.includes("RSI")}   onClick={() => toggleIndicator("RSI")}   color="#C084FC" />
              <IndBtn label="MACD"    active={indicators.includes("MACD")}  onClick={() => toggleIndicator("MACD")}  color="#00D97E" />
            </div>

            {/* Chart area */}
            <div className="px-2 py-3">
              {loading ? (
                <div className="h-80 flex items-center justify-center flex-col gap-3">
                  <RefreshCw size={28} className="animate-spin text-genius-green" />
                  <p className="text-xs text-genius-muted font-mono">Loading chart…</p>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-xs text-red-400 font-mono">Chart unavailable: {error}</p>
                </div>
              ) : data?.quotes?.length ? (
                <TvChart
                  quotes={data.quotes}
                  chartType={chartType}
                  indicators={indicators}
                  height={indicators.includes("RSI") || indicators.includes("MACD") ? 260 : 320}
                />
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-xs text-genius-muted font-mono">No chart data</p>
                </div>
              )}
            </div>

            {/* Fundamentals row */}
            {data && (
              <div className="grid grid-cols-4 gap-3 px-4 pb-4">
                {[
                  { label: "P/E Ratio",      value: data.trailingPE ? data.trailingPE.toFixed(1) : "—" },
                  { label: "Dividend Yield", value: data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : "—" },
                  { label: "52W Range",      value: data.fiftyTwoWeekLow && data.fiftyTwoWeekHigh ? `$${data.fiftyTwoWeekLow.toFixed(0)}–$${data.fiftyTwoWeekHigh.toFixed(0)}` : "—" },
                  { label: "Analyst Rating", value: data.analystRating ?? "—" },
                ].map(f => (
                  <div key={f.label} className="genius-card rounded-lg p-3 border border-genius-border/50">
                    <p className="text-[9px] text-genius-muted font-mono mb-1">{f.label}</p>
                    <p className="text-sm font-bold text-white font-mono">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: News ── */}
        {tab === "news" && (
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {/* Sentiment summary */}
            {news.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-genius-border/40 bg-genius-card">
                <div className="live-dot" />
                <span className="text-xs font-mono text-genius-muted">AI Sentiment</span>
                <span className="text-xs font-bold text-genius-green font-mono">
                  {sentimentCounts.bullish} Bullish
                </span>
                <span className="text-xs text-genius-muted">·</span>
                <span className="text-xs font-bold text-red-400 font-mono">
                  {sentimentCounts.bearish} Bearish
                </span>
                <span className="text-xs text-genius-muted">·</span>
                <span className="text-[10px] text-genius-muted font-mono">Scanning every 60s</span>
              </div>
            )}

            {newsLoading ? (
              <div className="h-40 flex items-center justify-center flex-col gap-3">
                <RefreshCw size={22} className="animate-spin text-genius-green" />
                <p className="text-xs text-genius-muted font-mono">Scanning news…</p>
              </div>
            ) : news.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-xs text-genius-muted font-mono">No recent news found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 rounded-xl border border-genius-border/40 hover:border-genius-green/30 hover:bg-genius-card transition-all group"
                  >
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 opacity-80" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          item.sentiment === "bullish" ? "bg-genius-green/15 text-genius-green border border-genius-green/30" :
                          item.sentiment === "bearish" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                          "bg-genius-border text-genius-muted border border-genius-border"
                        }`}>
                          {item.sentiment === "bullish" ? "▲ BULLISH" : item.sentiment === "bearish" ? "▼ BEARISH" : "NEUTRAL"}
                        </span>
                        <ExternalLink size={11} className="text-genius-muted group-hover:text-genius-green flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <p className="text-sm text-white leading-snug mb-1 line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-genius-muted font-mono">
                        <span>{item.publisher}</span>
                        <span>·</span>
                        <span>{timeAgo(item.publishedAt)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Trade ── */}
        {tab === "trade" && (
          <div className="flex-1 overflow-y-auto min-h-0 p-5">
            {orderDone ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-genius-green/20 border border-genius-green/30 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-white">Order Submitted</p>
                  <p className="text-sm text-genius-muted mt-1 font-mono">
                    {orderType.toUpperCase()} {orderSide} {orderQty || "—"} {sym}
                    {orderType === "limit" ? ` @ ${orderPrice}` : " at market price"}
                  </p>
                </div>
                <p className="text-xs text-genius-muted font-mono">Execution via connected broker (Alpaca)</p>
              </div>
            ) : (
              <div className="max-w-sm mx-auto flex flex-col gap-4">
                {/* Live price */}
                <div className="genius-card rounded-xl p-4 flex items-center justify-between border border-genius-border">
                  <div>
                    <p className="text-xs text-genius-muted font-mono">{sym} · LIVE PRICE</p>
                    <p className="text-2xl font-black font-mono" style={{ color }}>{fmt(data?.price)}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold font-mono ${up ? "text-genius-green" : "text-red-400"}`}>
                    {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {up ? "+" : ""}{data?.changePct.toFixed(2)}%
                  </div>
                </div>

                {/* Side buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderSide("BUY")}
                    className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${
                      orderSide === "BUY"
                        ? "bg-genius-green text-genius-black border-genius-green"
                        : "border-genius-border text-genius-muted hover:border-genius-green/40 hover:text-white"
                    }`}
                  >
                    <ArrowUpRight size={16} className="inline mr-1" />
                    BUY / LONG
                  </button>
                  <button
                    onClick={() => setOrderSide("SELL")}
                    className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${
                      orderSide === "SELL"
                        ? "bg-red-500 text-white border-red-500"
                        : "border-genius-border text-genius-muted hover:border-red-500/40 hover:text-white"
                    }`}
                  >
                    <ArrowDownRight size={16} className="inline mr-1" />
                    SELL / SHORT
                  </button>
                </div>

                {/* Order type */}
                <div className="flex gap-1 p-1 bg-genius-card rounded-xl border border-genius-border">
                  {(["market", "limit", "stop"] as OrderType[]).map(t => (
                    <button key={t} onClick={() => setOrderType(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono capitalize transition-all ${
                        orderType === t ? "bg-genius-green/15 text-genius-green" : "text-genius-muted hover:text-white"
                      }`}
                    >{t}</button>
                  ))}
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">QUANTITY (SHARES)</label>
                  <input
                    type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="w-full bg-genius-black border border-genius-border rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-genius-muted/40 focus:outline-none focus:border-genius-green"
                  />
                  {data && orderQty && (
                    <p className="text-xs text-genius-muted font-mono mt-1">
                      ≈ {fmt(parseFloat(orderQty) * data.price)} total
                    </p>
                  )}
                </div>

                {/* Limit price */}
                {(orderType === "limit" || orderType === "stop") && (
                  <div>
                    <label className="text-[10px] text-genius-muted font-mono block mb-1.5">
                      {orderType === "limit" ? "LIMIT PRICE" : "STOP PRICE"}
                    </label>
                    <input
                      type="number" value={orderPrice} onChange={e => setOrderPrice(e.target.value)}
                      placeholder={`$${data?.price.toFixed(2) ?? "0.00"}`}
                      className="w-full bg-genius-black border border-genius-border rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-genius-muted/40 focus:outline-none focus:border-genius-green"
                    />
                  </div>
                )}

                {/* Quick amounts */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">QUICK SELECT</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["$100","$500","$1k","$5k"].map(amt => {
                      const dollars = amt === "$1k" ? 1000 : amt === "$5k" ? 5000 : parseInt(amt.replace("$",""));
                      return (
                        <button
                          key={amt}
                          onClick={() => { if (data?.price) setOrderQty((dollars / data.price).toFixed(4)); }}
                          className="py-2 rounded-lg bg-genius-card border border-genius-border text-xs font-mono text-genius-muted hover:text-genius-green hover:border-genius-green/40 transition-all"
                        >{amt}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleOrder}
                  disabled={!orderQty}
                  className={`w-full py-3.5 rounded-xl font-black text-sm disabled:opacity-40 transition-all ${
                    orderSide === "BUY"
                      ? "bg-genius-green text-genius-black hover:bg-genius-green/90"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  <ShoppingCart size={14} className="inline mr-2" />
                  Place {orderType.toUpperCase()} {orderSide} Order
                </button>

                <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <AlertTriangle size={12} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-genius-muted leading-relaxed">
                    Orders route through your connected Alpaca broker. Paper trading mode active by default.
                    Go to <a href="/dashboard/settings?section=broker" className="text-genius-green hover:underline">Settings → Broker</a> to switch to live.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-genius-border/30 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] text-genius-muted font-mono">Data: Yahoo Finance · News scanning every 60s · ESC to close</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTab("news"); }}
              className="flex items-center gap-1.5 text-[10px] font-mono text-genius-muted hover:text-genius-green transition-colors"
            >
              <Bell size={11} />
              Set Alert
            </button>
            <button
              onClick={() => { setTab("trade"); }}
              className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-lg font-bold transition-all ${
                orderSide === "BUY" ? "bg-genius-green/10 text-genius-green hover:bg-genius-green/20" : "bg-red-500/10 text-red-400"
              }`}
            >
              <ShoppingCart size={11} />
              Trade {sym}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TickerChartProvider({ children }: { children: ReactNode }) {
  const [sym, setSym] = useState<string | null>(null);
  const open  = useCallback((s: string) => setSym(s.replace("-USD","").replace("/USD","")), []);
  const close = useCallback(() => setSym(null), []);

  return (
    <ChartCtx.Provider value={{ open, close }}>
      {children}
      {sym && <ChartModal sym={sym} onClose={close} />}
    </ChartCtx.Provider>
  );
}
