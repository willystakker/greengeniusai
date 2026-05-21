"use client";

import { useState, useEffect } from "react";
import {
  Activity, TrendingUp, TrendingDown, Zap, Shield,
  Settings2, ChevronRight, X, AlertTriangle, BarChart2,
  RefreshCw, Database, Layers,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";

// ─── Colors ───────────────────────────────────────────────────────────────────
const CYAN       = "#06B6D4";
const CYAN_DARK  = "#0891B2";
const CYAN_DIM   = "rgba(6,182,212,0.12)";
const CYAN_BORDER= "rgba(6,182,212,0.25)";

// ─── Data ─────────────────────────────────────────────────────────────────────
const POSITIONS = [
  { sym: "BTC-PERP", side: "LONG",  size: "0.12 BTC", entry: 68400,  mark: 77842, lev: 5,  liq: 54720,  upnl: 1133,   fund8h: 0.84  },
  { sym: "ETH-PERP", side: "LONG",  size: "1.8 ETH",  entry: 3200,   mark: 2136,  lev: 3,  liq: 2560,   upnl: -191,   fund8h: -0.12 },
  { sym: "SOL-PERP", side: "LONG",  size: "45 SOL",   entry: 142,    mark: 86.77, lev: 4,  liq: 113.6,  upnl: -466,   fund8h: 0.31  },
  { sym: "BNB-PERP", side: "SHORT", size: "2.4 BNB",  entry: 620,    mark: 598,   lev: 2,  liq: 775,    upnl: 52,     fund8h: 0.18  },
];

const FUNDING_TABLE = [
  { sym: "BTC",  mark: 77842,   fund8h: 0.0083,  annual: 9.12,   oi: "$18.4B", vol: "$32.1B" },
  { sym: "ETH",  mark: 2136,    fund8h: -0.0021, annual: -2.30,  oi: "$7.2B",  vol: "$14.8B" },
  { sym: "SOL",  mark: 86.77,   fund8h: 0.0041,  annual: 4.49,   oi: "$2.1B",  vol: "$4.3B"  },
  { sym: "BNB",  mark: 598,     fund8h: 0.0018,  annual: 1.97,   oi: "$0.9B",  vol: "$1.8B"  },
  { sym: "XRP",  mark: 0.5821,  fund8h: -0.0014, annual: -1.53,  oi: "$0.6B",  vol: "$2.1B"  },
  { sym: "AVAX", mark: 33.42,   fund8h: 0.0057,  annual: 6.25,   oi: "$0.4B",  vol: "$0.9B"  },
  { sym: "ARB",  mark: 0.7814,  fund8h: -0.0031, annual: -3.40,  oi: "$0.3B",  vol: "$0.7B"  },
  { sym: "DOGE", mark: 0.1423,  fund8h: 0.0095,  annual: 10.41,  oi: "$0.8B",  vol: "$1.6B"  },
];

const ASSETS = ["BTC","ETH","SOL","BNB","XRP","AVAX","DOGE","ARB","OP","MATIC"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, prefix = "$") {
  if (Math.abs(n) >= 1e9) return `${prefix}${(n/1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${prefix}${(n/1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${prefix}${n.toLocaleString()}`;
  return `${prefix}${n.toFixed(2)}`;
}

// ─── Liquidation Gauge ────────────────────────────────────────────────────────
function LiqGauge({ pct }: { pct: number }) {
  const color = pct < 30 ? "#22c55e" : pct < 60 ? "#eab308" : "#ef4444";
  const label = pct < 30 ? "LOW" : pct < 60 ? "MODERATE" : "HIGH";
  const sweep  = (pct / 100) * 180;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Track */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a2a1a" strokeWidth="14" strokeLinecap="round" />
        {/* Fill */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(sweep / 180) * 251.2} 251.2`}
        />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos(Math.PI - (sweep * Math.PI / 180))}
          y2={100 - 70 * Math.sin(Math.PI - (sweep * Math.PI / 180))}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        {/* Labels */}
        <text x="20" y="118" fill="#4A7A4A" fontSize="10" fontFamily="monospace">0%</text>
        <text x="88" y="25" fill="#4A7A4A" fontSize="10" fontFamily="monospace">50%</text>
        <text x="170" y="118" fill="#4A7A4A" fontSize="10" fontFamily="monospace">100%</text>
      </svg>
      <div className="text-center">
        <p className="text-3xl font-black font-mono" style={{ color }}>{pct}%</p>
        <p className="text-sm font-bold font-mono mt-1" style={{ color }}>{label} RISK</p>
        <p className="text-xs text-genius-muted font-mono mt-0.5">Portfolio-wide liquidation proximity</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PerpetualsPage() {
  const [flash,         setFlash]         = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [side,          setSide]          = useState<"LONG"|"SHORT">("LONG");
  const [leverage,      setLeverage]      = useState(3);
  const [orderSize,     setOrderSize]     = useState("");
  const [orderType,     setOrderType]     = useState<"Market"|"Limit"|"Stop-Market">("Market");
  const [limitPrice,    setLimitPrice]    = useState("");
  const [autoCompound,  setAutoCompound]  = useState(true);
  const [maxLevCap,     setMaxLevCap]     = useState<5|10|20>(5);
  const [riskPct,       setRiskPct]       = useState<1|2|5>(2);
  const [slMode,        setSlMode]        = useState<"Fixed"|"Trailing"|"Dynamic AI">("Trailing");
  const [orderPlaced,   setOrderPlaced]   = useState(false);

  const { open: openChart } = useTickerChart();

  useEffect(() => {
    const iv = setInterval(() => setFlash(f => !f), 1200);
    return () => clearInterval(iv);
  }, []);

  // Auto-calculated fields
  const sizeNum     = parseFloat(orderSize) || 0;
  const liqPrice    = sizeNum > 0 ? (side === "LONG" ? sizeNum * (1 - 1/leverage) : sizeNum * (1 + 1/leverage)).toFixed(2) : "—";
  const maxPos      = sizeNum > 0 ? `$${(sizeNum * leverage).toLocaleString()}` : "—";
  const reqMargin   = sizeNum > 0 ? `$${(sizeNum / leverage).toFixed(2)}` : "—";

  const totalPnl    = POSITIONS.reduce((s, p) => s + p.upnl, 0);
  const openCount   = POSITIONS.length;
  const avgLev      = (POSITIONS.reduce((s, p) => s + p.lev, 0) / POSITIONS.length).toFixed(1);
  const fundCollected = POSITIONS.reduce((s, p) => s + p.fund8h, 0);

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}` }}>
              <Layers size={18} style={{ color: CYAN }} />
            </div>
            Perp Bot — Perpetual Futures
          </h1>
          <p className="text-xs text-genius-muted font-mono mt-1.5 flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full transition-colors"
              style={{ background: flash ? CYAN : "#4A7A4A" }}
            />
            MONITORING FUNDING RATES
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all"
          style={{ borderColor: CYAN_BORDER, color: CYAN }}
        >
          <RefreshCw size={13} /> Refresh Positions
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "BTC Funding",        value: "+0.0083%/8h",   up: true  },
          { label: "ETH Funding",        value: "-0.0021%/8h",   up: false },
          { label: "Open Interest BTC",  value: "$18.4B",        up: null  },
          { label: "Liquidations 24h",   value: "$284M",         up: null  },
        ].map((s, i) => (
          <div key={i} className="genius-card rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ border: `1px solid ${CYAN_BORDER}` }}>
            <span className="text-xs text-genius-muted font-mono">{s.label}</span>
            <span className="text-xs font-bold font-mono" style={{
              color: s.up === true ? CYAN : s.up === false ? "#f87171" : "#e2e8f0"
            }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open Positions",    value: openCount,                             sub: "active perp trades",        icon: Activity,    up: null  },
          { label: "Total PnL",         value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()}`, sub: "unrealized",  icon: TrendingUp,  up: totalPnl >= 0 },
          { label: "Avg Leverage",      value: `${avgLev}x`,                          sub: "portfolio average",          icon: Zap,         up: null  },
          { label: "Funding Collected", value: `+$${fundCollected.toFixed(2)}`,        sub: "last 8h",                   icon: Database,    up: true  },
        ].map((k, i) => (
          <div key={i} className="genius-card rounded-xl p-4" style={{ border: `1px solid ${CYAN_BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: CYAN_DIM }}>
                <k.icon size={14} style={{ color: CYAN }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className="text-xs font-mono" style={{
              color: k.up === true ? CYAN : k.up === false ? "#f87171" : "#4A7A4A"
            }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Open Positions Table ── */}
      <div className="genius-card rounded-xl overflow-hidden" style={{ border: `1px solid ${CYAN_BORDER}` }}>
        <div className="flex items-center justify-between p-4 border-b border-genius-border">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BarChart2 size={16} style={{ color: CYAN }} />
            Open Perpetual Positions
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` }}>
            {openCount} Active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-genius-border bg-genius-dark">
                {["Asset","Side","Size","Entry Price","Mark Price","Leverage","Liq. Price","Unrealized PnL","Funding/8h","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((p, i) => (
                <tr key={i} className="border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openChart(p.sym.replace("-PERP",""))}
                      className="font-bold font-mono hover:underline"
                      style={{ color: CYAN }}
                    >{p.sym}</button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded text-xs font-black font-mono" style={
                      p.side === "LONG"
                        ? { background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` }
                        : { background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
                    }>{p.side}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-genius-text">{p.size}</td>
                  <td className="px-4 py-3 font-mono text-genius-text">${p.entry.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-white font-bold">${p.mark.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: CYAN }}>{p.lev}x</td>
                  <td className="px-4 py-3 font-mono text-yellow-400">${p.liq.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${p.upnl >= 0 ? "text-genius-green" : "text-red-400"}`}>
                      {p.upnl >= 0 ? "+" : ""}${p.upnl.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: p.fund8h >= 0 ? "#22c55e" : CYAN }}>
                    {p.fund8h >= 0 ? "+" : ""}${Math.abs(p.fund8h).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2.5 py-1 rounded text-xs font-bold transition-all" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                        Close
                      </button>
                      <button className="px-2.5 py-1 rounded text-xs font-bold transition-all" style={{ background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` }}>
                        Add Margin
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Trade Panel + Liquidation Risk ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* New Perp Trade */}
        <div className="col-span-2 genius-card rounded-xl p-5" style={{ border: `1px solid ${CYAN_BORDER}` }}>
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <Zap size={16} style={{ color: CYAN }} />
            New Perp Trade
          </h2>

          {orderPlaced ? (
            <div className="h-48 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}` }}>
                <span className="text-3xl" style={{ color: CYAN }}>✓</span>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">Order Submitted</p>
                <p className="text-sm text-genius-muted font-mono mt-1">
                  {orderType.toUpperCase()} {side} {selectedAsset}-PERP · {leverage}x
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {/* Left col */}
              <div className="flex flex-col gap-4">
                {/* Asset */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">ASSET</label>
                  <select
                    value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
                    className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none"
                    style={{ borderColor: CYAN_BORDER }}
                  >
                    {ASSETS.map(a => <option key={a} value={a}>{a}-PERP</option>)}
                  </select>
                </div>

                {/* Long / Short */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">DIRECTION</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSide("LONG")}
                      className="py-2.5 rounded-lg font-black text-sm transition-all border-2"
                      style={side === "LONG"
                        ? { background: CYAN, color: "#000", borderColor: CYAN }
                        : { borderColor: "#2a3a2a", color: "#4A7A4A" }}
                    >LONG</button>
                    <button
                      onClick={() => setSide("SHORT")}
                      className="py-2.5 rounded-lg font-black text-sm transition-all border-2"
                      style={side === "SHORT"
                        ? { background: "#ef4444", color: "#fff", borderColor: "#ef4444" }
                        : { borderColor: "#2a3a2a", color: "#4A7A4A" }}
                    >SHORT</button>
                  </div>
                </div>

                {/* Order type */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">ORDER TYPE</label>
                  <div className="flex gap-1 p-1 genius-card rounded-xl border border-genius-border">
                    {(["Market","Limit","Stop-Market"] as const).map(t => (
                      <button key={t} onClick={() => setOrderType(t)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                        style={orderType === t ? { background: CYAN_DIM, color: CYAN } : { color: "#4A7A4A" }}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Limit price */}
                {orderType === "Limit" && (
                  <div>
                    <label className="text-[10px] text-genius-muted font-mono block mb-1.5">LIMIT PRICE (USD)</label>
                    <input
                      type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                      placeholder="e.g. 75000"
                      className="w-full bg-genius-black border rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-genius-muted/40 focus:outline-none"
                      style={{ borderColor: CYAN_BORDER }}
                    />
                  </div>
                )}
              </div>

              {/* Right col */}
              <div className="flex flex-col gap-4">
                {/* Leverage slider */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[10px] text-genius-muted font-mono">LEVERAGE</label>
                    <span className="text-xs font-black font-mono" style={{ color: CYAN }}>{leverage}x</span>
                  </div>
                  <input
                    type="range" min={1} max={20} value={leverage}
                    onChange={e => setLeverage(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-genius-muted font-mono mt-1">
                    <span>1x</span><span>10x</span><span>20x</span>
                  </div>
                  {leverage > 5 && (
                    <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      <AlertTriangle size={11} className="text-yellow-400 flex-shrink-0" />
                      <span className="text-[10px] text-yellow-400 font-mono">High leverage — increased liquidation risk</span>
                    </div>
                  )}
                </div>

                {/* Order size */}
                <div>
                  <label className="text-[10px] text-genius-muted font-mono block mb-1.5">ORDER SIZE (USD)</label>
                  <input
                    type="number" value={orderSize} onChange={e => setOrderSize(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-genius-black border rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-genius-muted/40 focus:outline-none"
                    style={{ borderColor: CYAN_BORDER }}
                  />
                </div>

                {/* Calculated fields */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}` }}>
                  {[
                    { label: "Liq. Price",      value: liqPrice === "—" ? "—" : `$${liqPrice}` },
                    { label: "Max Position",     value: maxPos },
                    { label: "Required Margin",  value: reqMargin },
                  ].map(f => (
                    <div key={f.label} className="flex justify-between text-xs font-mono">
                      <span className="text-genius-muted">{f.label}</span>
                      <span className="font-bold" style={{ color: CYAN }}>{f.value}</span>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={!orderSize}
                  className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40 transition-all"
                  style={side === "LONG"
                    ? { background: CYAN, color: "#000" }
                    : { background: "#ef4444", color: "#fff" }}
                >
                  Place {side === "LONG" ? "Long" : "Short"} — {leverage}x
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liquidation Risk Meter */}
        <div className="genius-card rounded-xl p-5 flex flex-col" style={{ border: `1px solid ${CYAN_BORDER}` }}>
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield size={16} style={{ color: CYAN }} />
            Liquidation Risk
          </h2>
          <div className="flex-1 flex items-center justify-center">
            <LiqGauge pct={22} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div className="rounded-lg py-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-green-400 font-bold">&lt;30%</p>
              <p className="text-genius-muted">Safe</p>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <p className="text-yellow-400 font-bold">30–60%</p>
              <p className="text-genius-muted">Caution</p>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 font-bold">&gt;60%</p>
              <p className="text-genius-muted">Danger</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Funding Rate Table ── */}
      <div className="genius-card rounded-xl overflow-hidden" style={{ border: `1px solid ${CYAN_BORDER}` }}>
        <div className="p-4 border-b border-genius-border flex items-center gap-2">
          <Activity size={16} style={{ color: CYAN }} />
          <h2 className="font-bold text-white">Funding Rate Monitor — Top 8 Perps</h2>
          <span className="ml-auto text-[10px] text-genius-muted font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: CYAN }} />
            Live · Updates every 8h
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-genius-border bg-genius-dark">
              {["Asset","Mark Price","8h Funding","Annualized","Open Interest","24h Volume"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNDING_TABLE.map((row, i) => (
              <tr key={i} className="border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                <td className="px-4 py-3">
                  <button onClick={() => openChart(row.sym)} className="font-bold font-mono hover:underline" style={{ color: CYAN }}>
                    {row.sym}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-white">${row.mark.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="font-mono font-bold" style={{ color: row.fund8h >= 0 ? "#22c55e" : CYAN }}>
                    {row.fund8h >= 0 ? "+" : ""}{row.fund8h.toFixed(4)}%
                  </span>
                  {row.fund8h >= 0 && <span className="ml-1 text-[9px] text-genius-muted font-mono">(longs pay)</span>}
                  {row.fund8h < 0 && <span className="ml-1 text-[9px] font-mono" style={{ color: CYAN }}>(shorts pay)</span>}
                </td>
                <td className="px-4 py-3 font-mono" style={{ color: row.annual >= 0 ? "#22c55e" : CYAN }}>
                  {row.annual >= 0 ? "+" : ""}{row.annual.toFixed(2)}%
                </td>
                <td className="px-4 py-3 font-mono text-genius-text">{row.oi}</td>
                <td className="px-4 py-3 font-mono text-genius-text">{row.vol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bot Settings ── */}
      <div className="genius-card rounded-xl p-5" style={{ border: `1px solid ${CYAN_BORDER}` }}>
        <h2 className="font-bold text-white mb-5 flex items-center gap-2">
          <Settings2 size={16} style={{ color: CYAN }} />
          Bot Settings
        </h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {/* Auto-compound */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">AUTO-COMPOUND FUNDING</p>
            <button
              onClick={() => setAutoCompound(c => !c)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={autoCompound ? { background: CYAN_DIM, border: `1px solid ${CYAN_BORDER}` } : { background: "#1a1a1a", border: "1px solid #2a3a2a" }}
            >
              <div className="w-8 h-4 rounded-full relative transition-all" style={{ background: autoCompound ? CYAN : "#374151" }}>
                <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: autoCompound ? "17px" : "2px" }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: autoCompound ? CYAN : "#4A7A4A" }}>
                {autoCompound ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Max leverage cap */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">MAX LEVERAGE CAP</p>
            <div className="flex gap-1">
              {([5,10,20] as const).map(v => (
                <button key={v} onClick={() => setMaxLevCap(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={maxLevCap === v ? { background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` } : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{v}x</button>
              ))}
            </div>
          </div>

          {/* Risk per trade */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">RISK PER TRADE</p>
            <div className="flex gap-1">
              {([1,2,5] as const).map(v => (
                <button key={v} onClick={() => setRiskPct(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={riskPct === v ? { background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` } : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{v}%</button>
              ))}
            </div>
          </div>

          {/* Stop-loss mode */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">STOP-LOSS MODE</p>
            <div className="flex gap-1 flex-wrap">
              {(["Fixed","Trailing","Dynamic AI"] as const).map(v => (
                <button key={v} onClick={() => setSlMode(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={slMode === v ? { background: CYAN_DIM, color: CYAN, border: `1px solid ${CYAN_BORDER}` } : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
