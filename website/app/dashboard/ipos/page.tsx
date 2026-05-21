"use client";

import { useState, useEffect } from "react";
import {
  Rocket, Star, TrendingUp, Calendar, Clock, Brain, Zap,
  ChevronRight, Bell, CheckCircle, X, AlertTriangle, BarChart2,
  Filter, ArrowUpRight, Target,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";

// ─── Colors ───────────────────────────────────────────────────────────────────
const AMBER        = "#F59E0B";
const AMBER_DARK   = "#D97706";
const AMBER_DIM    = "rgba(245,158,11,0.10)";
const AMBER_BORDER = "rgba(245,158,11,0.25)";

// ─── Data ─────────────────────────────────────────────────────────────────────
const UPCOMING_IPOS = [
  { company: "StrikeAI Inc",          ticker: "STAI", sector: "AI/Tech",        range: "$18–$22", date: "in 2 days",  exchange: "NASDAQ", raise: "$420M", demand: "HOT",  aiScore: 91 },
  { company: "NovaBiome Health",       ticker: "NBIO", sector: "Biotech",        range: "$12–$15", date: "in 4 days",  exchange: "NYSE",   raise: "$180M", demand: "WARM", aiScore: 74 },
  { company: "QuantumEdge Systems",    ticker: "QEDG", sector: "Semiconductors", range: "$28–$32", date: "in 1 week",  exchange: "NASDAQ", raise: "$680M", demand: "HOT",  aiScore: 88 },
  { company: "ClearPath Energy",       ticker: "CPTH", sector: "Clean Energy",   range: "$10–$13", date: "in 1 week",  exchange: "NYSE",   raise: "$220M", demand: "WARM", aiScore: 67 },
  { company: "NeuralDrive Robotics",   ticker: "NDRI", sector: "Robotics/AI",    range: "$22–$26", date: "in 10 days", exchange: "NASDAQ", raise: "$510M", demand: "HOT",  aiScore: 86 },
  { company: "OceanBlue Logistics",    ticker: "OBLS", sector: "Logistics",      range: "$8–$11",  date: "in 2 weeks", exchange: "NYSE",   raise: "$140M", demand: "COLD", aiScore: 48 },
  { company: "HorizonMed Pharma",      ticker: "HMED", sector: "Pharma",         range: "$16–$19", date: "in 2 weeks", exchange: "NASDAQ", raise: "$290M", demand: "WARM", aiScore: 72 },
  { company: "CoreVault Security",     ticker: "CVLT", sector: "Cybersecurity",  range: "$24–$28", date: "in 3 weeks", exchange: "NASDAQ", raise: "$440M", demand: "HOT",  aiScore: 83 },
  { company: "SolarStream Power",      ticker: "SLSP", sector: "Clean Energy",   range: "$14–$17", date: "in 3 weeks", exchange: "NYSE",   raise: "$310M", demand: "WARM", aiScore: 69 },
];

const PERF_HISTORY = [
  { company: "Reddit Inc",         ticker: "RDDT", ipoPrice: 34,    current: 68.40,  day1: 48.2,  total: 101.2, status: "HELD"   },
  { company: "Astera Labs",        ticker: "ALAB", ipoPrice: 36,    current: 89.20,  day1: 72.1,  total: 147.8, status: "HELD"   },
  { company: "BrainChip Holdings", ticker: "BRN",  ipoPrice: 0.28,  current: 0.19,   day1: -12.4, total: -32.1, status: "EXITED" },
  { company: "Rubrik Inc",         ticker: "RBRK", ipoPrice: 32,    current: 41.80,  day1: 16.2,  total: 30.6,  status: "HELD"   },
  { company: "Loar Holdings",      ticker: "LOAR", ipoPrice: 28,    current: 79.30,  day1: 43.8,  total: 183.2, status: "HELD"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function demandColor(d: string) {
  if (d === "HOT")  return { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" };
  if (d === "WARM") return { bg: AMBER_DIM, color: AMBER, border: AMBER_BORDER };
  return { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.25)" };
}

function sectorColor(s: string) {
  if (s.includes("AI") || s.includes("Robotics")) return { bg: AMBER_DIM, color: AMBER };
  if (s.includes("Bio") || s.includes("Pharma"))  return { bg: "rgba(34,197,94,0.10)", color: "#4ade80" };
  if (s.includes("Energy"))                        return { bg: "rgba(250,204,21,0.10)", color: "#fde047" };
  if (s.includes("Cyber") || s.includes("Semi"))   return { bg: "rgba(99,102,241,0.10)", color: "#818cf8" };
  return { bg: "rgba(100,116,139,0.10)", color: "#94a3b8" };
}

// ─── IPO Card ─────────────────────────────────────────────────────────────────
function IpoCard({ ipo, onWatch }: { ipo: typeof UPCOMING_IPOS[0]; onWatch: (t: string) => void }) {
  const [watched, setWatched] = useState(false);
  const demand = demandColor(ipo.demand);
  const sector = sectorColor(ipo.sector);
  const isHot  = ipo.demand === "HOT";

  return (
    <div className="genius-card rounded-xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{ border: isHot ? `1px solid ${AMBER_BORDER}` : "1px solid rgba(30,40,30,0.8)" }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black text-white text-sm leading-tight">{ipo.company}</p>
          <p className="text-xs font-mono mt-0.5" style={{ color: AMBER }}>${ipo.ticker}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full"
            style={{ background: demand.bg, color: demand.color, border: `1px solid ${demand.border}` }}>
            {ipo.demand === "HOT" ? "🔥 " : ipo.demand === "WARM" ? "⚡ " : "❄️ "}{ipo.demand}
          </span>
          <span className="text-[10px] font-mono text-genius-muted">{ipo.exchange}</span>
        </div>
      </div>

      {/* Sector badge */}
      <span className="self-start text-[10px] font-bold font-mono px-2 py-0.5 rounded"
        style={{ background: sector.bg, color: sector.color }}>
        {ipo.sector}
      </span>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <p className="text-genius-muted">Price Range</p>
          <p className="font-bold text-white">{ipo.range}</p>
        </div>
        <div>
          <p className="text-genius-muted">Est. Raise</p>
          <p className="font-bold text-white">{ipo.raise}</p>
        </div>
        <div>
          <p className="text-genius-muted flex items-center gap-1"><Clock size={9}/> Date</p>
          <p className="font-bold" style={{ color: AMBER }}>{ipo.date}</p>
        </div>
        <div>
          <p className="text-genius-muted">AI Score</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-genius-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${ipo.aiScore}%`, background: ipo.aiScore >= 80 ? AMBER : ipo.aiScore >= 70 ? "#22c55e" : "#94a3b8" }} />
            </div>
            <span className="font-bold" style={{ color: ipo.aiScore >= 80 ? AMBER : ipo.aiScore >= 70 ? "#22c55e" : "#94a3b8" }}>
              {ipo.aiScore}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => { setWatched(w => !w); onWatch(ipo.ticker); }}
          className="flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1"
          style={watched
            ? { background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }
            : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
        >
          <Star size={11} fill={watched ? AMBER : "none"} />
          {watched ? "Watching" : "Watch"}
        </button>
        <button
          className="flex-1 py-2 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1 transition-all"
          style={{ background: AMBER, color: "#000" }}
        >
          <Rocket size={11} /> Pre-Order
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IposPage() {
  const [flash,       setFlash]       = useState(false);
  const [watchlist,   setWatchlist]   = useState<string[]>([]);
  const [autoAlloc,   setAutoAlloc]   = useState(true);
  const [maxAlloc,    setMaxAlloc]    = useState<500|1000|2500|"Custom">(1000);
  const [minScore,    setMinScore]    = useState<70|75|80|85>(80);
  const [holdStrat,   setHoldStrat]   = useState<"Flip Day 1"|"Hold 30d"|"AI-Managed">("AI-Managed");
  const [filterDemand,setFilterDemand]= useState<"ALL"|"HOT"|"WARM"|"COLD">("ALL");

  const { open: openChart } = useTickerChart();

  useEffect(() => {
    const iv = setInterval(() => setFlash(f => !f), 1200);
    return () => clearInterval(iv);
  }, []);

  const handleWatch = (ticker: string) => {
    setWatchlist(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]);
  };

  const filtered = UPCOMING_IPOS.filter(ipo => filterDemand === "ALL" || ipo.demand === filterDemand);

  const hotCount  = UPCOMING_IPOS.filter(i => i.demand === "HOT").length;
  const warmCount = UPCOMING_IPOS.filter(i => i.demand === "WARM").length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
              <Rocket size={18} style={{ color: AMBER }} />
            </div>
            IPO Scout — Upcoming Listings
          </h1>
          <p className="text-xs text-genius-muted font-mono mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full transition-colors" style={{ background: flash ? AMBER : "#4A7A4A" }} />
            MONITORING 847 FILINGS
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all"
          style={{ borderColor: AMBER_BORDER, color: AMBER }}>
          <Bell size={13} /> Set Alert
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "IPOs This Month",       value: "12" },
          { label: "Avg First-Day Pop",     value: "+34.2%" },
          { label: "Watchlisted",           value: `${watchlist.length || 4}` },
          { label: "Hot Deals",             value: `${hotCount}` },
        ].map((s, i) => (
          <div key={i} className="genius-card rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ border: `1px solid ${AMBER_BORDER}` }}>
            <span className="text-xs text-genius-muted font-mono">{s.label}</span>
            <span className="text-xs font-bold font-mono" style={{ color: AMBER }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total IPO Gains", value: "+$8,420", sub: "all-time realized",     icon: TrendingUp,   up: true  },
          { label: "Win Rate",        value: "82.1%",   sub: "profitable exits",       icon: Target,       up: true  },
          { label: "Avg Return",      value: "+31.5%",  sub: "per IPO position",       icon: BarChart2,    up: true  },
          { label: "Next IPO",        value: "2 days",  sub: "StrikeAI (STAI)",        icon: Clock,        up: null  },
        ].map((k, i) => (
          <div key={i} className="genius-card rounded-xl p-4" style={{ border: `1px solid ${AMBER_BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: AMBER_DIM }}>
                <k.icon size={14} style={{ color: AMBER }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className="text-xs font-mono" style={{ color: k.up ? AMBER : "#4A7A4A" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── IPO Calendar Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Calendar size={16} style={{ color: AMBER }} />
            Upcoming IPO Calendar
          </h2>
          <div className="flex items-center gap-1">
            <Filter size={12} className="text-genius-muted" />
            {(["ALL","HOT","WARM","COLD"] as const).map(f => (
              <button key={f} onClick={() => setFilterDemand(f)}
                className="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all"
                style={filterDemand === f
                  ? { background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }
                  : { color: "#4A7A4A" }}
              >{f}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((ipo, i) => (
            <IpoCard key={i} ipo={ipo} onWatch={handleWatch} />
          ))}
        </div>
      </div>

      {/* ── IPO Performance History ── */}
      <div className="genius-card rounded-xl overflow-hidden" style={{ border: `1px solid ${AMBER_BORDER}` }}>
        <div className="flex items-center justify-between p-4 border-b border-genius-border">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BarChart2 size={16} style={{ color: AMBER }} />
            IPO Performance History
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono text-genius-muted">
            <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-400" /> {PERF_HISTORY.filter(p => p.status==="HELD").length} Held</span>
            <span className="flex items-center gap-1"><X size={11} className="text-red-400" /> {PERF_HISTORY.filter(p => p.status==="EXITED").length} Exited</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-genius-border bg-genius-dark">
              {["Company","Ticker","IPO Price","Current Price","Day 1 Return","Current Return","Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERF_HISTORY.map((p, i) => (
              <tr key={i} className="border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{p.company}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openChart(p.ticker)} className="font-mono font-bold hover:underline" style={{ color: AMBER }}>
                    {p.ticker}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-genius-text">${p.ipoPrice.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-white font-bold">${p.current.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono font-bold ${p.day1 >= 0 ? "text-genius-green" : "text-red-400"}`}>
                    {p.day1 >= 0 ? "+" : ""}{p.day1}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono font-bold ${p.total >= 0 ? "text-genius-green" : "text-red-400"}`}>
                    {p.total >= 0 ? "+" : ""}{p.total}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.status === "HELD" ? (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-green-400">
                      <CheckCircle size={12} /> HELD
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-red-400">
                      <X size={12} /> EXITED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── IPO Analysis Panel (StrikeAI) ── */}
      <div className="genius-card rounded-xl p-5" style={{ border: `1px solid ${AMBER_BORDER}` }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Brain size={16} style={{ color: AMBER }} />
              AI Analysis — StrikeAI Inc (STAI)
            </h2>
            <p className="text-xs text-genius-muted font-mono mt-1">Top pick · IPO in 2 days · NASDAQ · $18–$22</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="px-3 py-1 rounded-full text-sm font-black font-mono" style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}>
              AI Score: 91/100
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1.5 bg-genius-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "91%", background: AMBER }} />
              </div>
              <span className="text-[10px] font-mono text-genius-muted">Confidence</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Overview */}
          <div className="col-span-1 rounded-xl p-4" style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
            <p className="text-[10px] text-genius-muted font-mono mb-2">COMPANY OVERVIEW</p>
            <p className="text-sm text-genius-text leading-relaxed">
              StrikeAI Inc is an enterprise AI infrastructure company providing real-time inference optimization and cost reduction tooling for LLM deployments.
              Strong ARR growth of 340% YoY, 82 enterprise clients including 4 Fortune 500.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div><p className="text-genius-muted">Founded</p><p className="text-white font-bold">2021</p></div>
              <div><p className="text-genius-muted">ARR</p><p style={{ color: AMBER }} className="font-bold">$48M</p></div>
              <div><p className="text-genius-muted">Growth</p><p className="text-green-400 font-bold">+340% YoY</p></div>
              <div><p className="text-genius-muted">Clients</p><p className="text-white font-bold">82 Enterprise</p></div>
            </div>
          </div>

          {/* Bull / Bear */}
          <div className="col-span-1 flex flex-col gap-3">
            <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-[10px] font-mono font-bold text-green-400 mb-2 flex items-center gap-1">
                <TrendingUp size={11} /> BULL CASE
              </p>
              <ul className="text-xs text-genius-text space-y-1.5">
                <li className="flex gap-1.5"><ArrowUpRight size={11} className="text-green-400 flex-shrink-0 mt-0.5" />AI infrastructure market expanding 58% CAGR</li>
                <li className="flex gap-1.5"><ArrowUpRight size={11} className="text-green-400 flex-shrink-0 mt-0.5" />Revenue retention at 138% — best-in-class NRR</li>
                <li className="flex gap-1.5"><ArrowUpRight size={11} className="text-green-400 flex-shrink-0 mt-0.5" />Backed by Andreessen Horowitz &amp; Sequoia</li>
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[10px] font-mono font-bold text-red-400 mb-2 flex items-center gap-1">
                <AlertTriangle size={11} /> BEAR CASE / KEY RISKS
              </p>
              <ul className="text-xs text-genius-text space-y-1.5">
                <li className="flex gap-1.5"><X size={11} className="text-red-400 flex-shrink-0 mt-0.5" />Not yet profitable — path to profitability unclear</li>
                <li className="flex gap-1.5"><X size={11} className="text-red-400 flex-shrink-0 mt-0.5" />Heavy competition from AWS, Azure, Google</li>
                <li className="flex gap-1.5"><X size={11} className="text-red-400 flex-shrink-0 mt-0.5" />Concentration risk: top 3 clients = 41% revenue</li>
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div className="col-span-1 rounded-xl p-4 flex flex-col gap-4" style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
            <div>
              <p className="text-[10px] text-genius-muted font-mono mb-1">AI RECOMMENDATION</p>
              <p className="text-lg font-black" style={{ color: AMBER }}>STRONG BUY</p>
              <p className="text-xs text-genius-text leading-relaxed mt-1">
                High-growth AI infrastructure with strong moat. Valuation justified at $18–$22 given 340% ARR growth.
                Expect 40–60% day-1 pop given hot market conditions and institutional demand.
              </p>
            </div>
            <div>
              <p className="text-[10px] text-genius-muted font-mono mb-2">ALLOCATION STRATEGY</p>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between"><span className="text-genius-muted">Target Entry</span><span className="text-white font-bold">$20 (mid-range)</span></div>
                <div className="flex justify-between"><span className="text-genius-muted">Day-1 Target</span><span className="text-green-400 font-bold">$28–$32</span></div>
                <div className="flex justify-between"><span className="text-genius-muted">30d Target</span><span style={{ color: AMBER }} className="font-bold">$38–$45</span></div>
                <div className="flex justify-between"><span className="text-genius-muted">Stop-Loss</span><span className="text-red-400 font-bold">$16 (-20%)</span></div>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-auto transition-all hover:opacity-90"
              style={{ background: AMBER, color: "#000" }}>
              <Rocket size={15} /> Pre-Order Allocation
            </button>
          </div>
        </div>
      </div>

      {/* ── Bot Settings ── */}
      <div className="genius-card rounded-xl p-5" style={{ border: `1px solid ${AMBER_BORDER}` }}>
        <h2 className="font-bold text-white mb-5 flex items-center gap-2">
          <Zap size={16} style={{ color: AMBER }} />
          Bot Settings
        </h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {/* Auto-allocate */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">AUTO-ALLOCATE TO HOT IPOs</p>
            <button
              onClick={() => setAutoAlloc(a => !a)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={autoAlloc ? { background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` } : { background: "#1a1a1a", border: "1px solid #2a3a2a" }}
            >
              <div className="w-8 h-4 rounded-full relative transition-all" style={{ background: autoAlloc ? AMBER : "#374151" }}>
                <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: autoAlloc ? "17px" : "2px" }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: autoAlloc ? AMBER : "#4A7A4A" }}>
                {autoAlloc ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Max allocation */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">MAX ALLOCATION PER IPO</p>
            <div className="flex gap-1 flex-wrap">
              {([500, 1000, 2500, "Custom"] as const).map(v => (
                <button key={String(v)} onClick={() => setMaxAlloc(v as any)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={maxAlloc === v
                    ? { background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }
                    : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{typeof v === "number" ? `$${v.toLocaleString()}` : v}</button>
              ))}
            </div>
          </div>

          {/* Min AI score */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">MIN AI SCORE THRESHOLD</p>
            <div className="flex gap-1">
              {([70, 75, 80, 85] as const).map(v => (
                <button key={v} onClick={() => setMinScore(v)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={minScore === v
                    ? { background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }
                    : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{v}</button>
              ))}
            </div>
          </div>

          {/* Hold strategy */}
          <div>
            <p className="text-[10px] text-genius-muted font-mono mb-2">HOLD STRATEGY</p>
            <div className="flex gap-1 flex-wrap">
              {(["Flip Day 1","Hold 30d","AI-Managed"] as const).map(v => (
                <button key={v} onClick={() => setHoldStrat(v)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all"
                  style={holdStrat === v
                    ? { background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }
                    : { background: "#1a1a1a", color: "#4A7A4A", border: "1px solid #2a3a2a" }}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
