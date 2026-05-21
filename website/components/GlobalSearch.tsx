"use client";

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { Search, X, Clock, TrendingUp, Cpu, Layers, Star, ArrowRight, Command } from "lucide-react";
import { useTickerChart } from "./TickerChartProvider";

// ─── Ticker database ──────────────────────────────────────────────────────────
const TICKERS = [
  // ── Mega-cap Equities ──
  { sym: "AAPL",  name: "Apple Inc",               cat: "Stock",  hot: true  },
  { sym: "MSFT",  name: "Microsoft Corp",           cat: "Stock",  hot: true  },
  { sym: "NVDA",  name: "NVIDIA Corp",              cat: "Stock",  hot: true  },
  { sym: "GOOGL", name: "Alphabet Inc",             cat: "Stock",  hot: true  },
  { sym: "AMZN",  name: "Amazon.com Inc",           cat: "Stock",  hot: true  },
  { sym: "META",  name: "Meta Platforms",           cat: "Stock",  hot: true  },
  { sym: "TSLA",  name: "Tesla Inc",                cat: "Stock",  hot: true  },
  { sym: "AMD",   name: "Advanced Micro Devices",   cat: "Stock",  hot: false },
  { sym: "INTC",  name: "Intel Corp",               cat: "Stock",  hot: false },
  { sym: "CRM",   name: "Salesforce Inc",           cat: "Stock",  hot: false },
  { sym: "ORCL",  name: "Oracle Corp",              cat: "Stock",  hot: false },
  { sym: "ADBE",  name: "Adobe Inc",                cat: "Stock",  hot: false },
  { sym: "NFLX",  name: "Netflix Inc",              cat: "Stock",  hot: true  },
  { sym: "PYPL",  name: "PayPal Holdings",          cat: "Stock",  hot: false },
  { sym: "SHOP",  name: "Shopify Inc",              cat: "Stock",  hot: false },
  { sym: "SNOW",  name: "Snowflake Inc",            cat: "Stock",  hot: false },
  { sym: "PLTR",  name: "Palantir Technologies",    cat: "Stock",  hot: true  },
  { sym: "SMCI",  name: "Super Micro Computer",     cat: "Stock",  hot: true  },
  { sym: "ARM",   name: "Arm Holdings",             cat: "Stock",  hot: true  },
  { sym: "TSM",   name: "Taiwan Semiconductor",     cat: "Stock",  hot: false },
  { sym: "AVGO",  name: "Broadcom Inc",             cat: "Stock",  hot: false },
  { sym: "QCOM",  name: "Qualcomm Inc",             cat: "Stock",  hot: false },
  { sym: "MU",    name: "Micron Technology",        cat: "Stock",  hot: false },
  { sym: "JPM",   name: "JPMorgan Chase",           cat: "Stock",  hot: false },
  { sym: "GS",    name: "Goldman Sachs",            cat: "Stock",  hot: false },
  { sym: "BAC",   name: "Bank of America",          cat: "Stock",  hot: false },
  { sym: "V",     name: "Visa Inc",                 cat: "Stock",  hot: false },
  { sym: "MA",    name: "Mastercard Inc",           cat: "Stock",  hot: false },
  { sym: "BRK-B", name: "Berkshire Hathaway B",     cat: "Stock",  hot: false },
  { sym: "UNH",   name: "UnitedHealth Group",       cat: "Stock",  hot: false },
  { sym: "LLY",   name: "Eli Lilly",                cat: "Stock",  hot: true  },
  { sym: "JNJ",   name: "Johnson & Johnson",        cat: "Stock",  hot: false },
  { sym: "PFE",   name: "Pfizer Inc",               cat: "Stock",  hot: false },
  { sym: "MRNA",  name: "Moderna Inc",              cat: "Stock",  hot: false },
  { sym: "ABNB",  name: "Airbnb Inc",               cat: "Stock",  hot: false },
  { sym: "UBER",  name: "Uber Technologies",        cat: "Stock",  hot: false },
  { sym: "LYFT",  name: "Lyft Inc",                 cat: "Stock",  hot: false },
  { sym: "COIN",  name: "Coinbase Global",          cat: "Stock",  hot: true  },
  { sym: "MSTR",  name: "MicroStrategy Inc",        cat: "Stock",  hot: true  },
  { sym: "HOOD",  name: "Robinhood Markets",        cat: "Stock",  hot: false },
  { sym: "SQ",    name: "Block Inc",                cat: "Stock",  hot: false },
  { sym: "DIS",   name: "Walt Disney Co",           cat: "Stock",  hot: false },
  { sym: "SPOT",  name: "Spotify Technology",       cat: "Stock",  hot: false },
  { sym: "RBLX",  name: "Roblox Corp",              cat: "Stock",  hot: false },
  { sym: "U",     name: "Unity Software",           cat: "Stock",  hot: false },
  // ── Crypto ──
  { sym: "BTC",   name: "Bitcoin",                  cat: "Crypto", hot: true  },
  { sym: "ETH",   name: "Ethereum",                 cat: "Crypto", hot: true  },
  { sym: "SOL",   name: "Solana",                   cat: "Crypto", hot: true  },
  { sym: "BNB",   name: "Binance Coin",             cat: "Crypto", hot: false },
  { sym: "XRP",   name: "Ripple",                   cat: "Crypto", hot: true  },
  { sym: "ADA",   name: "Cardano",                  cat: "Crypto", hot: false },
  { sym: "AVAX",  name: "Avalanche",                cat: "Crypto", hot: false },
  { sym: "DOGE",  name: "Dogecoin",                 cat: "Crypto", hot: true  },
  { sym: "MATIC", name: "Polygon",                  cat: "Crypto", hot: false },
  { sym: "LINK",  name: "Chainlink",                cat: "Crypto", hot: false },
  { sym: "DOT",   name: "Polkadot",                 cat: "Crypto", hot: false },
  { sym: "LTC",   name: "Litecoin",                 cat: "Crypto", hot: false },
  // ── ETFs ──
  { sym: "SPY",   name: "S&P 500 ETF (SPDR)",       cat: "ETF",    hot: true  },
  { sym: "QQQ",   name: "Nasdaq 100 ETF",           cat: "ETF",    hot: true  },
  { sym: "IWM",   name: "Russell 2000 ETF",         cat: "ETF",    hot: false },
  { sym: "GLD",   name: "Gold ETF (SPDR)",          cat: "ETF",    hot: false },
  { sym: "SLV",   name: "Silver ETF (iShares)",     cat: "ETF",    hot: false },
  { sym: "TLT",   name: "20+ Yr Treasury ETF",      cat: "ETF",    hot: false },
  { sym: "VIX",   name: "CBOE Volatility Index",    cat: "Index",  hot: true  },
  { sym: "ARKK",  name: "ARK Innovation ETF",       cat: "ETF",    hot: false },
  { sym: "SOXL",  name: "Semis Bull 3x ETF",        cat: "ETF",    hot: false },
  { sym: "TQQQ",  name: "QQQ Bull 3x ETF",          cat: "ETF",    hot: false },
  // ── Indices ──
  { sym: "SPX",   name: "S&P 500 Index",            cat: "Index",  hot: true  },
  { sym: "NDX",   name: "NASDAQ 100 Index",         cat: "Index",  hot: true  },
  { sym: "DJI",   name: "Dow Jones Industrial",     cat: "Index",  hot: false },
  { sym: "OIL",   name: "Crude Oil (WTI Futures)",  cat: "Futures",hot: false },
  { sym: "GC=F",  name: "Gold Futures",             cat: "Futures",hot: false },
];

const CAT_ICON: Record<string, any> = {
  Stock: TrendingUp, Crypto: Cpu, ETF: Layers, Index: Star, Futures: Star,
};
const CAT_COLOR: Record<string, string> = {
  Stock: "#00FF41", Crypto: "#00D97E", ETF: "#38BDF8", Index: "#FFD700", Futures: "#C084FC",
};

const RECENT_KEY = "ggai_recent_searches";

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(sym: string) {
  try {
    const prev = loadRecent().filter(s => s !== sym);
    localStorage.setItem(RECENT_KEY, JSON.stringify([sym, ...prev].slice(0, 6)));
  } catch {}
}

export default function GlobalSearch() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [cursor,  setCursor]  = useState(0);
  const [recent,  setRecent]  = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { open: openChart }  = useTickerChart();

  // Load recent on mount
  useEffect(() => { setRecent(loadRecent()); }, []);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 60); }
    else       { setQuery(""); setCursor(0); }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TICKERS.filter(t =>
      t.sym.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  const listItems = query ? results : TICKERS.filter(t => t.hot).slice(0, 12);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, listItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter") {
        const item = listItems[cursor];
        if (item) selectTicker(item.sym);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, cursor, listItems]);

  const selectTicker = useCallback((sym: string) => {
    openChart(sym);
    saveRecent(sym);
    setRecent(loadRecent());
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, [openChart]);

  const recentItems = recent.map(s => TICKERS.find(t => t.sym === s)).filter(Boolean) as typeof TICKERS;

  return (
    <>
      {/* ── Fixed search bar — always on screen ─────────────────────────────── */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-4"
        style={{ pointerEvents: "auto" }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-mono transition-all group"
          style={{
            background: "rgba(10,15,10,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,255,65,0.2)",
            boxShadow: "0 4px 24px rgba(0,255,65,0.08), 0 1px 0 rgba(0,255,65,0.06) inset",
          }}
        >
          <Search size={15} className="text-genius-green flex-shrink-0" />
          <span className="text-genius-muted group-hover:text-white flex-1 text-left transition-colors">
            Search any ticker…
          </span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-genius-card border border-genius-border text-genius-muted text-[10px] font-sans leading-none flex items-center gap-0.5">
              <Command size={8} />K
            </kbd>
          </div>
        </button>
      </div>

      {/* ── Search overlay ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-start justify-center pt-20 px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          onClick={() => { setOpen(false); setQuery(""); }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(8,12,8,0.98)",
              border: "1px solid rgba(0,255,65,0.25)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,65,0.05)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-genius-border/40">
              <Search size={18} className="text-genius-green flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                placeholder="Search ticker, company, crypto…"
                className="flex-1 bg-transparent text-white text-lg font-mono placeholder-genius-muted/50 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-genius-muted hover:text-white transition-colors">
                  <X size={16} />
                </button>
              )}
              <kbd
                onClick={() => { setOpen(false); setQuery(""); }}
                className="px-2 py-1 rounded border border-genius-border text-genius-muted text-xs font-sans cursor-pointer hover:text-white transition-colors"
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {/* Recent searches */}
              {!query && recentItems.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] text-genius-muted font-mono mb-2 flex items-center gap-1.5">
                    <Clock size={10} /> RECENT SEARCHES
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentItems.map(t => (
                      <button
                        key={t.sym}
                        onClick={() => selectTicker(t.sym)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-genius-border hover:border-genius-green/50 hover:bg-genius-green/5 transition-all"
                      >
                        <span className="text-xs font-black font-mono" style={{ color: CAT_COLOR[t.cat] }}>{t.sym}</span>
                        <span className="text-[10px] text-genius-muted font-mono">{t.cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section label */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] text-genius-muted font-mono flex items-center gap-1.5">
                  {query
                    ? <><Search size={10} /> {results.length} RESULTS FOR "{query.toUpperCase()}"</>
                    : <><TrendingUp size={10} /> TRENDING NOW</>
                  }
                </p>
              </div>

              {/* Ticker list */}
              {listItems.length === 0 && query ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-genius-muted font-mono text-sm">No results for "{query}"</p>
                  <p className="text-genius-muted/60 font-mono text-xs mt-1">Try a different symbol or company name</p>
                  <button
                    onClick={() => selectTicker(query.toUpperCase())}
                    className="mt-4 px-4 py-2 rounded-xl border border-genius-green/30 text-genius-green text-sm font-mono hover:bg-genius-green/5 transition-all"
                  >
                    Try "{query.toUpperCase()}" anyway →
                  </button>
                </div>
              ) : (
                <div className="pb-3">
                  {listItems.map((t, i) => {
                    const Icon = CAT_ICON[t.cat] ?? TrendingUp;
                    const color = CAT_COLOR[t.cat] ?? "#00FF41";
                    const active = i === cursor;
                    return (
                      <button
                        key={t.sym}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => selectTicker(t.sym)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all ${
                          active ? "bg-genius-green/8" : "hover:bg-genius-card/60"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}14`, border: `1px solid ${color}30` }}
                        >
                          <Icon size={16} style={{ color }} />
                        </div>

                        {/* Sym + name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white font-mono text-base"
                              dangerouslySetInnerHTML={{
                                __html: query
                                  ? t.sym.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), '<mark style="background:rgba(0,255,65,0.2);color:#00FF41;border-radius:2px">$1</mark>')
                                  : t.sym
                              }}
                            />
                            {t.hot && (
                              <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full bg-genius-green/15 text-genius-green border border-genius-green/20">
                                HOT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-genius-muted font-mono truncate"
                            dangerouslySetInnerHTML={{
                              __html: query
                                ? t.name.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), '<mark style="background:rgba(0,255,65,0.2);color:#00FF41;border-radius:2px">$1</mark>')
                                : t.name
                            }}
                          />
                        </div>

                        {/* Category badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg"
                            style={{ color, background: `${color}14`, border: `1px solid ${color}25` }}
                          >
                            {t.cat.toUpperCase()}
                          </span>
                          {active && <ArrowRight size={13} className="text-genius-green" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-genius-border/30 flex items-center gap-4 text-[10px] text-genius-muted font-mono">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">↵</kbd> open chart</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-genius-border font-sans">ESC</kbd> close</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-genius-green animate-pulse" />
                  70+ instruments · live data
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
