"use client";

import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { X, TrendingUp, TrendingDown, RefreshCw, ExternalLink, BarChart2 } from "lucide-react";

// ─── Context ──────────────────────────────────────────────────────────────────
type Ctx = { open: (sym: string) => void; close: () => void };
const ChartCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export function useTickerChart() { return useContext(ChartCtx); }

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";
type ChartData = {
  sym: string; name: string; price: number; changePct: number;
  open?: number; high?: number; low?: number; volume?: number; marketCap?: number;
  quotes: { t: string; c: number }[];
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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#050A05] border border-genius-border rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-genius-muted mb-0.5">{label}</p>
      <p className="text-genius-green font-black text-base">{fmt(payload[0].value)}</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ChartModal({ sym, onClose }: { sym: string; onClose: () => void }) {
  const [range,   setRange]   = useState<Range>("1M");
  const [data,    setData]    = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async (s: string, r: Range) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/chart?sym=${encodeURIComponent(s)}&range=${r}`);
      if (!res.ok) throw new Error("Fetch failed");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(sym, range); }, [sym, range, load]);

  // Escape key to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const up       = (data?.changePct ?? 0) >= 0;
  const color    = up ? "#00FF41" : "#FF4444";
  const minPrice = data ? Math.min(...data.quotes.map(q => q.c)) * 0.998 : 0;
  const maxPrice = data ? Math.max(...data.quotes.map(q => q.c)) * 1.002 : 0;
  const prevClose = data?.quotes?.[0]?.c;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0a0f0a", border: "1px solid #1a2a1a" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-genius-border/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={20} className="text-genius-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white font-mono">{sym}</span>
                {data && (
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${up ? "bg-genius-green/15 text-genius-green border border-genius-green/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                    {up ? "+" : ""}{data.changePct.toFixed(2)}%
                  </span>
                )}
              </div>
              {data && <p className="text-xs text-genius-muted mt-0.5 font-mono">{data.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <div className="text-right">
                <p className="text-2xl font-black font-mono" style={{ color }}>{fmt(data.price)}</p>
                <p className={`text-xs font-mono ${up ? "text-genius-green" : "text-red-400"}`}>
                  {up ? "▲" : "▼"} {fmt(Math.abs(data.price * data.changePct / 100))} today
                </p>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-lg border border-genius-border/50 text-genius-muted hover:text-white hover:border-genius-green/40 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-genius-border/30">
          {(["1D","1W","1M","3M","1Y","5Y"] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                range === r
                  ? "bg-genius-green text-genius-black"
                  : "text-genius-muted hover:text-white hover:bg-genius-card"
              }`}
            >
              {r}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-genius-muted font-mono">
            {loading && <RefreshCw size={11} className="animate-spin text-genius-green" />}
            <span className="w-1.5 h-1.5 rounded-full bg-genius-green animate-pulse inline-block" />
            LIVE
          </div>
        </div>

        {/* Chart */}
        <div className="px-2 py-3" style={{ height: 280 }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-genius-green" />
                <p className="text-xs text-genius-muted font-mono">Loading chart data…</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-red-400 font-mono">Chart unavailable: {error}</p>
            </div>
          ) : data?.quotes?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.quotes} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`chartGrad_${sym}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "#4A7A4A", fontSize: 10 }} axisLine={false} tickLine={false}
                  interval={Math.floor((data.quotes.length - 1) / 6)} />
                <YAxis domain={[minPrice, maxPrice]} tick={{ fill: "#4A7A4A", fontSize: 10 }} axisLine={false}
                  tickLine={false} tickFormatter={v => fmt(v, v >= 1000 ? 0 : 2)} width={60} />
                <Tooltip content={<ChartTip />} />
                {prevClose && (
                  <ReferenceLine y={prevClose} stroke="#4A7A4A" strokeDasharray="3 3" strokeWidth={1} />
                )}
                <Area type="monotone" dataKey="c" stroke={color} strokeWidth={2}
                  fill={`url(#chartGrad_${sym})`} dot={false} activeDot={{ r: 4, fill: color, stroke: "#0a0f0a", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-genius-muted font-mono">No chart data available</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        {data && !loading && (
          <div className="grid grid-cols-5 gap-0 border-t border-genius-border/30 px-6 py-4">
            {[
              { label: "OPEN",       value: fmt(data.open) },
              { label: "HIGH",       value: fmt(data.high) },
              { label: "LOW",        value: fmt(data.low) },
              { label: "VOLUME",     value: fmtVol(data.volume) },
              { label: "MARKET CAP", value: fmt(data.marketCap) },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-genius-muted font-mono mb-1">{s.label}</p>
                <p className="text-sm font-black text-white font-mono">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <p className="text-xs text-genius-muted font-mono">Data via Yahoo Finance · Refreshes every 60s</p>
          <p className="text-xs text-genius-muted font-mono">Press ESC to close</p>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TickerChartProvider({ children }: { children: ReactNode }) {
  const [sym, setSym] = useState<string | null>(null);
  const open  = useCallback((s: string) => setSym(s.replace("-USD", "").replace("/USD", "")), []);
  const close = useCallback(() => setSym(null), []);

  return (
    <ChartCtx.Provider value={{ open, close }}>
      {children}
      {sym && <ChartModal sym={sym} onClose={close} />}
    </ChartCtx.Provider>
  );
}
