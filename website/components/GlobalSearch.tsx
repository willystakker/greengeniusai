"use client";

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
  Search, X, Clock, TrendingUp, Cpu, Layers, Star,
  ArrowRight, Command, RefreshCw, Globe,
} from "lucide-react";
import { useTickerChart } from "./TickerChartProvider";

// ─── Static trending list (shown when no query) ───────────────────────────────
const TRENDING = [
  { sym: "NVDA",  name: "NVIDIA Corp",            type: "Stock",  hot: true  },
  { sym: "BTC",   name: "Bitcoin",                type: "Crypto", hot: true  },
  { sym: "TSLA",  name: "Tesla Inc",              type: "Stock",  hot: true  },
  { sym: "AAPL",  name: "Apple Inc",              type: "Stock",  hot: true  },
  { sym: "MSFT",  name: "Microsoft Corp",         type: "Stock",  hot: true  },
  { sym: "PLTR",  name: "Palantir Technologies",  type: "Stock",  hot: true  },
  { sym: "ETH",   name: "Ethereum",               type: "Crypto", hot: true  },
  { sym: "SOL",   name: "Solana",                 type: "Crypto", hot: true  },
  { sym: "META",  name: "Meta Platforms",         type: "Stock",  hot: true  },
  { sym: "AMZN",  name: "Amazon.com Inc",         type: "Stock",  hot: true  },
  { sym: "SPY",   name: "S&P 500 ETF",            type: "ETF",    hot: true  },
  { sym: "QQQ",   name: "Nasdaq 100 ETF",         type: "ETF",    hot: true  },
  { sym: "SMCI",  name: "Super Micro Computer",   type: "Stock",  hot: true  },
  { sym: "ARM",   name: "Arm Holdings",           type: "Stock",  hot: true  },
  { sym: "COIN",  name: "Coinbase Global",        type: "Stock",  hot: true  },
  { sym: "MSTR",  name: "MicroStrategy Inc",      type: "Stock",  hot: true  },
  { sym: "LLY",   name: "Eli Lilly",              type: "Stock",  hot: true  },
  { sym: "AMD",   name: "Advanced Micro Devices", type: "Stock",  hot: false },
  { sym: "GOOGL", name: "Alphabet Inc",           type: "Stock",  hot: false },
  { sym: "NFLX",  name: "Netflix Inc",            type: "Stock",  hot: false },
];

type Result = { sym: string; name: string; type: string; exchange?: string };

const TYPE_COLOR: Record<string, string> = {
  Stock: "#00FF41", Crypto: "#00D97E", ETF: "#38BDF8",
  Index: "#FFD700", Fund: "#C084FC", Forex: "#FB923C",
  Futures: "#F472B6", Option: "#94A3B8",
};
const TYPE_ICON: Record<string, any> = {
  Stock: TrendingUp, Crypto: Cpu, ETF: Layers,
  Index: Star, Fund: Layers, Forex: Globe, Futures: Star,
};

const RECENT_KEY = "ggai_recent_searches";
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(sym: string) {
  try {
    const prev = loadRecent().filter(s => s !== sym);
    localStorage.setItem(RECENT_KEY, JSON.stringify([sym, ...prev].slice(0, 8)));
  } catch {}
}

export default function GlobalSearch() {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [cursor,    setCursor]    = useState(0);
  const [recent,    setRecent]    = useState<string[]>([]);
  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open: openChart } = useTickerChart();

  useEffect(() => { setRecent(loadRecent()); }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") { setOpen(false); setQuery(""); setResults([]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Focus when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else { setQuery(""); setResults([]); setCursor(0); }
  }, [open]);

  // Live search — debounced 200ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setResults(d.results ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const listItems: Result[] = query.trim()
    ? results
    : TRENDING;

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, listItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter") { const item = listItems[cursor]; if (item) select(item.sym); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, cursor, listItems]);

  const select = useCallback((sym: string) => {
    openChart(sym);
    saveRecent(sym);
    setRecent(loadRecent());
    setOpen(false);
    setQuery("");
    setResults([]);
    setCursor(0);
  }, [openChart]);

  const recentResults: Result[] = recent
    .map(s => TRENDING.find(t => t.sym === s) ?? { sym: s, name: s, type: "Stock" })
    .slice(0, 8);

  const highlight = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    try {
      return text.replace(
        new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
        '<mark style="background:rgba(0,255,65,0.2);color:#00FF41;border-radius:2px;padding:0 1px">$1</mark>'
      );
    } catch { return text; }
  };

  return (
    <>
      {/* ── Persistent pill ───────────────────────────────────────────────── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xs px-4" style={{ pointerEvents: "auto" }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-mono transition-all group"
          style={{
            background: "rgba(8,13,8,0.90)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,255,65,0.22)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,65,0.04) inset",
          }}
        >
          <Search size={14} className="text-genius-green flex-shrink-0" />
          <span className="text-genius-muted group-hover:text-white flex-1 text-left transition-colors text-xs">
            Search any ticker…
          </span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-genius-card border border-genius-border text-genius-muted text-[10px] font-sans leading-none">
            <Command size={8} />K
          </kbd>
        </button>
      </div>

      {/* ── Overlay ────────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-start justify-center pt-16 px-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(14px)" }}
          onClick={() => { setOpen(false); setQuery(""); }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(7,11,7,0.99)",
              border: "1px solid rgba(0,255,65,0.22)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(0,255,65,0.04)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-genius-border/40">
              {searching
                ? <RefreshCw size={17} className="text-genius-green animate-spin flex-shrink-0" />
                : <Search size={17} className="text-genius-green flex-shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                placeholder="Search any stock, crypto, ETF, index, futures…"
                className="flex-1 bg-transparent text-white text-lg font-mono placeholder-genius-muted/50 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query
                ? <button onClick={() => { setQuery(""); setResults([]); }} className="text-genius-muted hover:text-white transition-colors p-1"><X size={15} /></button>
                : null
              }
              <kbd
                onClick={() => { setOpen(false); setQuery(""); }}
                className="px-2 py-1 rounded border border-genius-border text-genius-muted text-xs font-sans cursor-pointer hover:text-white transition-colors flex-shrink-0"
              >ESC</kbd>
            </div>

            {/* Body */}
            <div className="overflow-y-auto" style={{ maxHeight: "62vh" }}>

              {/* Recent searches */}
              {!query && recentResults.length > 0 && (
                <div className="px-5 pt-3 pb-2">
                  <p className="text-[10px] text-genius-muted font-mono mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock size={10} /> Recent
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentResults.map(t => {
                      const color = TYPE_COLOR[t.type] ?? "#00FF41";
                      return (
                        <button key={t.sym} onClick={() => select(t.sym)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-genius-border hover:border-genius-green/50 hover:bg-genius-green/5 transition-all">
                          <span className="text-xs font-black font-mono" style={{ color }}>{t.sym}</span>
                          <span className="text-[10px] text-genius-muted font-mono">{t.type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section label */}
              <div className="px-5 pt-3 pb-1">
                <p className="text-[10px] text-genius-muted font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  {query.trim() ? (
                    searching
                      ? <><RefreshCw size={10} className="animate-spin" /> Searching Yahoo Finance…</>
                      : <><Search size={10} /> {results.length} result{results.length !== 1 ? "s" : ""} for "{query.toUpperCase()}"</>
                  ) : (
                    <><TrendingUp size={10} /> Trending Now</>
                  )}
                </p>
              </div>

              {/* Ticker list */}
              {listItems.length === 0 && query.trim() && !searching ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-genius-muted font-mono text-sm mb-1">No results for "{query}"</p>
                  <p className="text-genius-muted/50 font-mono text-xs mb-4">Try the exact symbol (e.g. AAPL, BTC-USD)</p>
                  <button onClick={() => select(query.toUpperCase())}
                    className="px-4 py-2 rounded-xl border border-genius-green/30 text-genius-green text-sm font-mono hover:bg-genius-green/5 transition-all flex items-center gap-2 mx-auto">
                    <Search size={13} /> Open chart for "{query.toUpperCase()}"
                  </button>
                </div>
              ) : (
                <div className="pb-3">
                  {listItems.map((t, i) => {
                    const color = TYPE_COLOR[t.type] ?? "#00FF41";
                    const Icon  = TYPE_ICON[t.type] ?? TrendingUp;
                    const active = i === cursor;
                    return (
                      <button key={`${t.sym}-${i}`}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => select(t.sym)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                          active ? "bg-genius-green/8" : "hover:bg-white/3"
                        }`}
                      >
                        {/* Icon bubble */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                          <Icon size={16} style={{ color }} />
                        </div>

                        {/* Sym + name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white font-mono text-base"
                              dangerouslySetInnerHTML={{ __html: highlight(t.sym) }} />
                            {(t as any).hot && (
                              <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full bg-genius-green/15 text-genius-green border border-genius-green/20">HOT</span>
                            )}
                          </div>
                          <p className="text-xs text-genius-muted font-mono truncate"
                            dangerouslySetInnerHTML={{ __html: highlight(t.name) }} />
                          {t.exchange && (
                            <p className="text-[10px] text-genius-muted/50 font-mono">{t.exchange}</p>
                          )}
                        </div>

                        {/* Type badge + arrow */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg"
                            style={{ color, background: `${color}12`, border: `1px solid ${color}22` }}>
                            {t.type.toUpperCase()}
                          </span>
                          {active && <ArrowRight size={13} className="text-genius-green" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-3 border-t border-genius-border/30 flex items-center gap-4 text-[10px] text-genius-muted font-mono">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">↵</kbd> open chart
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">ESC</kbd> close
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Globe size={9} className="text-genius-green" />
                  Every ticker on earth · Yahoo Finance
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
