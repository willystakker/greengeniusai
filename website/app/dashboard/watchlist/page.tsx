"use client";

import { useState, useMemo } from "react";
import { Star, Plus, X, TrendingUp, TrendingDown, Search, RefreshCw, Eye, Zap } from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";
import { useLivePrices } from "@/lib/hooks/useLivePrices";

// ─── Data ─────────────────────────────────────────────────────────────────────
const NAMES: Record<string, string> = {
  AAPL: "Apple Inc",       TSLA: "Tesla Inc",       AMZN: "Amazon",
  GOOGL: "Alphabet",       NVDA: "NVIDIA",           MSFT: "Microsoft",
  META: "Meta Platforms",  BTC: "Bitcoin",           ETH: "Ethereum",
  SOL: "Solana",           AMD: "AMD",               INTC: "Intel",
  NFLX: "Netflix",         DIS: "Disney",            JPM: "JPMorgan",
  GS: "Goldman Sachs",     V: "Visa",                PYPL: "PayPal",
  SHOP: "Shopify",         SMCI: "Super Micro",
  SPX: "S&P 500",          NDX: "NASDAQ",            DJI: "Dow Jones",
};

const DEFAULT_WATCHLIST = ["AAPL","TSLA","AMZN","GOOGL","NVDA","MSFT","META","BTC","ETH","SOL"];
const INDICES = ["SPX","NDX","DJI","BTC"];

type SortMode = "Default" | "Gainers" | "Losers" | "Alphabetical";

// ─── Sparkline (fake 7-bar using divs) ───────────────────────────────────────
function Sparkline({ up }: { up: boolean }) {
  const bars = [40, 55, 35, 65, 50, 70, up ? 85 : 30];
  const color = up ? "#00FF41" : "#f87171";
  return (
    <div className="flex items-end gap-px h-6 w-14">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm opacity-80"
          style={{ height: `${h}%`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const { open: openChart }       = useTickerChart();
  const { prices, loading, lastUpdated, pulse } = useLivePrices(15000);

  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [sortMode, setSortMode]   = useState<SortMode>("Default");
  const [addInput, setAddInput]   = useState("");
  const [botSyms, setBotSyms]     = useState<Set<string>>(new Set());

  const addSymbol = () => {
    const sym = addInput.trim().toUpperCase();
    if (!sym || watchlist.includes(sym)) { setAddInput(""); return; }
    setWatchlist(w => [...w, sym]);
    setAddInput("");
  };

  const removeSym = (sym: string) => setWatchlist(w => w.filter(s => s !== sym));

  const toggleBot = (sym: string) =>
    setBotSyms(prev => { const next = new Set(prev); next.has(sym) ? next.delete(sym) : next.add(sym); return next; });

  // sort
  const sorted = useMemo(() => {
    const list = [...watchlist];
    if (sortMode === "Gainers")     return list.sort((a, b) => (prices[b]?.changePct ?? 0) - (prices[a]?.changePct ?? 0));
    if (sortMode === "Losers")      return list.sort((a, b) => (prices[a]?.changePct ?? 0) - (prices[b]?.changePct ?? 0));
    if (sortMode === "Alphabetical") return list.sort();
    return list;
  }, [watchlist, sortMode, prices]);

  const gainers = watchlist.filter(s => (prices[s]?.changePct ?? 0) > 0).length;
  const losers  = watchlist.filter(s => (prices[s]?.changePct ?? 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Watchlist</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">
            {watchlist.length} symbols · {gainers} gainers · {losers} losers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className={`text-xs text-genius-muted font-mono flex items-center gap-1.5 transition-colors ${pulse ? "text-genius-green" : ""}`}>
              <RefreshCw size={10} className={pulse ? "animate-spin" : ""} />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Market Indices Strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {INDICES.map(idx => {
          const p = prices[idx];
          const up = p?.up ?? true;
          return (
            <button
              key={idx}
              onClick={() => openChart(idx)}
              className="genius-card rounded-xl p-3 text-left hover:border-genius-green/30 transition-colors"
            >
              <p className="text-xs font-mono text-genius-muted mb-1">{NAMES[idx] ?? idx}</p>
              <p className="text-sm font-black text-white font-mono">
                {loading ? "—" : p ? `$${p.price}` : "—"}
              </p>
              <p className={`text-xs font-bold font-mono ${up ? "text-genius-green" : "text-red-400"}`}>
                {loading ? "—" : p ? `${up ? "+" : ""}${p.change}` : "—"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Add symbol */}
        <div className="flex items-center gap-2 flex-1 min-w-48 max-w-xs">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-genius-muted" />
            <input
              type="text"
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSymbol()}
              placeholder="Add symbol (e.g. SHOP)"
              className="w-full bg-genius-dark border border-genius-border rounded-lg pl-9 pr-3 py-2 text-white text-sm font-mono placeholder-genius-muted/50 focus:outline-none focus:border-genius-green"
            />
          </div>
          <button
            onClick={addSymbol}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-genius text-sm font-bold flex-shrink-0"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
          {(["Default","Gainers","Losers","Alphabetical"] as SortMode[]).map(m => (
            <button
              key={m}
              onClick={() => setSortMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                sortMode === m
                  ? "bg-genius-green text-genius-black"
                  : "bg-genius-border text-genius-muted hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Watchlist Table ── */}
      <div className="genius-card rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-genius-border text-xs font-mono text-genius-muted">
          <div className="col-span-4">SYMBOL</div>
          <div className="col-span-2 text-right">PRICE</div>
          <div className="col-span-2 text-right">CHANGE</div>
          <div className="col-span-2 text-right">7D</div>
          <div className="col-span-2 text-right">ACTIONS</div>
        </div>

        {sorted.length === 0 && (
          <div className="px-5 py-10 text-center text-genius-muted text-sm font-mono">
            Your watchlist is empty. Add a symbol above.
          </div>
        )}

        <div className="flex flex-col divide-y divide-genius-border/40">
          {sorted.map(sym => {
            const p   = prices[sym];
            const up  = p?.up ?? true;
            const inBot = botSyms.has(sym);
            return (
              <div key={sym} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-genius-card transition-colors group">
                {/* Symbol + name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    up ? "bg-genius-green/10" : "bg-red-400/10"
                  }`}>
                    {up
                      ? <TrendingUp size={14} className="text-genius-green" />
                      : <TrendingDown size={14} className="text-red-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => openChart(sym)}
                      className="text-sm font-black text-white font-mono hover:text-genius-green transition-colors"
                    >
                      {sym}
                    </button>
                    <p className="text-xs text-genius-muted truncate">{NAMES[sym] ?? sym}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-white font-mono">
                    {loading ? <span className="text-genius-muted">—</span> : p ? `$${p.price}` : <span className="text-genius-muted">—</span>}
                  </p>
                </div>

                {/* Change */}
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-bold font-mono ${up ? "text-genius-green" : "text-red-400"}`}>
                    {loading ? "—" : p ? `${up ? "+" : ""}${p.change}` : "—"}
                  </span>
                </div>

                {/* Sparkline */}
                <div className="col-span-2 flex justify-end">
                  <Sparkline up={up} />
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openChart(sym)}
                    title="View chart"
                    className="p-1.5 rounded-lg text-genius-muted hover:text-white hover:bg-genius-border transition-colors"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => toggleBot(sym)}
                    title={inBot ? "Remove from bot" : "Add to bot"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      inBot
                        ? "text-genius-green bg-genius-green/10"
                        : "text-genius-muted hover:text-genius-green hover:bg-genius-green/10"
                    }`}
                  >
                    <Zap size={13} />
                  </button>
                  <button
                    onClick={() => removeSym(sym)}
                    title="Remove"
                    className="p-1.5 rounded-lg text-genius-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bot Symbols Summary ── */}
      {botSyms.size > 0 && (
        <div className="genius-card rounded-xl p-4 border border-genius-green/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-genius-green" />
            <h2 className="text-sm font-bold text-white">Active Bot Symbols</h2>
            <span className="ml-auto text-xs text-genius-muted font-mono">{botSyms.size} trading</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(botSyms).map(s => (
              <div
                key={s}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-genius-green/10 border border-genius-green/30 text-xs font-mono text-genius-green"
              >
                <div className="live-dot" />
                {s}
                <button onClick={() => toggleBot(s)} className="hover:text-white ml-0.5">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
