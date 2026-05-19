"use client";

import { useState, useEffect } from "react";
import {
  Brain, TrendingUp, TrendingDown, Activity, AlertTriangle,
  Globe, BarChart3, RefreshCw, ChevronUp, ChevronDown,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const SIGNALS = [
  { sym: "NVDA", name: "NVIDIA Corp",    rating: "STRONG BUY", confidence: 94, target: 1050, current: 875, upside: "+19.9%", reason: "AI infrastructure supercycle; data center rev +427% YoY; H100 backlog extends 12 months", sector: "Tech" },
  { sym: "SMCI", name: "Super Micro",    rating: "BUY",        confidence: 87, target: 980,  current: 830, upside: "+18.1%", reason: "Server rack density play; AI server demand; improving gross margins; Dell partnership", sector: "Tech" },
  { sym: "BTC",  name: "Bitcoin",        rating: "BUY",        confidence: 85, target: 95000,current: 77272, upside: "+22.9%",reason: "Post-halving accumulation; ETF inflow velocity; on-chain HODL waves signal conviction", sector: "Crypto" },
  { sym: "MSFT", name: "Microsoft",      rating: "BUY",        confidence: 83, target: 480,  current: 415, upside: "+15.7%", reason: "Copilot enterprise adoption accelerating; Azure AI services growing 3x faster than consensus", sector: "Tech" },
  { sym: "SOL",  name: "Solana",         rating: "BUY",        confidence: 79, target: 230,  current: 177, upside: "+29.9%", reason: "Dencun-equivalent upgrade lowering fees; DeFi TVL recovery; mobile wallet growth", sector: "Crypto" },
  { sym: "TSLA", name: "Tesla Inc",      rating: "HOLD",       confidence: 51, target: 185,  current: 177, upside: "+4.5%",  reason: "EV demand softness offset by FSD progress; robotaxi optionality high but timing uncertain", sector: "EV" },
  { sym: "META", name: "Meta Platforms", rating: "BUY",        confidence: 77, target: 580,  current: 528, upside: "+9.8%",  reason: "AI-driven ad efficiency improvements; Threads monetization imminent; Reality Labs stabilizing", sector: "Tech" },
  { sym: "AMD",  name: "AMD",            rating: "BUY",        confidence: 82, target: 200,  current: 165, upside: "+21.2%", reason: "MI300X GPU ramp accelerating; data center CPU share gains; AI inference workloads growing", sector: "Tech" },
];

const SECTORS = [
  { name: "Technology",   perf: +2.84, color: "#00FF41" },
  { name: "Crypto",       perf: +4.12, color: "#00D97E" },
  { name: "Energy",       perf: +0.41, color: "#4A7A4A" },
  { name: "Healthcare",   perf: -0.18, color: "#FF6B6B" },
  { name: "Financials",   perf: +0.92, color: "#7FFF00" },
  { name: "Consumer",     perf: -0.67, color: "#FF6B6B" },
  { name: "Industrials",  perf: +0.33, color: "#4A7A4A" },
  { name: "Real Estate",  perf: -1.21, color: "#FF4444" },
];

const MACRO = [
  { label: "Fed Funds Rate",  value: "5.25%",  delta: "0bp",    trend: null,  note: "Unchanged — next meeting Jun 12" },
  { label: "10Y Treasury",    value: "4.48%",  delta: "+3bp",   trend: "up",  note: "Yield curve steepening" },
  { label: "VIX",             value: "18.4",   delta: "-1.2",   trend: "down",note: "Volatility compressing" },
  { label: "DXY (USD)",       value: "104.2",  delta: "+0.3%",  trend: "up",  note: "Dollar strength headwind" },
  { label: "Gold",            value: "$2,315", delta: "-0.4%",  trend: "down",note: "Risk-on rotation" },
  { label: "WTI Crude",       value: "$81.40", delta: "+1.1%",  trend: "up",  note: "OPEC supply discipline" },
];

const NEWS_ITEMS = [
  { headline: "Fed minutes signal rates staying higher for longer as inflation stays sticky",    sentiment: -62, ago: "1h ago" },
  { headline: "NVIDIA CEO: AI infrastructure spend is 'just beginning' — data centers upgrade cycle underway", sentiment: +91, ago: "2h ago" },
  { headline: "Bitcoin ETF inflows hit $480M single-day record, BlackRock leads institutional demand", sentiment: +88, ago: "3h ago" },
  { headline: "China AI chip export restrictions expand, pushing US cloud providers to accelerate domestic buildout", sentiment: +45, ago: "4h ago" },
  { headline: "Bank of Japan raises rates, sparking yen carry-trade unwind concerns globally", sentiment: -55, ago: "6h ago" },
];

const RADAR_DATA = [
  { factor: "Momentum",    score: 82 }, { factor: "Value",      score: 44 },
  { factor: "Growth",      score: 91 }, { factor: "Quality",    score: 78 },
  { factor: "Sentiment",   score: 73 }, { factor: "Macro",      score: 58 },
];

const RATING_COLOR: Record<string, string> = {
  "STRONG BUY": "text-genius-green border-genius-green/40 bg-genius-green/10",
  "BUY":        "text-genius-emerald border-genius-emerald/40 bg-genius-emerald/10",
  "HOLD":       "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "SELL":       "text-red-400 border-red-400/40 bg-red-500/10",
};

export default function InsightsPage() {
  const [tab, setTab]       = useState<"signals"|"sectors"|"macro">("signals");
  const [lastUpdated, setLastUpdated] = useState("just now");
  const [refreshing, setRefreshing]   = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastUpdated("just now"); }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">AI Intelligence Center</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">Quantitative signals · Macro overlay · Sentiment analysis</p>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-genius-border text-genius-muted hover:text-genius-green hover:border-genius-green transition-all text-sm font-semibold">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Market Regime Banner */}
      <div className="genius-card rounded-xl p-5 border border-genius-green/25 bg-genius-green/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="live-dot" />
          <span className="text-xs font-mono font-bold text-genius-green">MARKET REGIME · LIVE</span>
          <span className="ml-auto text-xs text-genius-muted font-mono">Updated {lastUpdated}</span>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-black text-white">RISK-ON</span>
              <span className="text-genius-green font-mono font-bold text-lg">↑ Bullish</span>
            </div>
            <p className="text-sm text-genius-text leading-relaxed">
              Momentum indicators are in alignment across equities and crypto. Institutional flows are net positive for the third consecutive week. AI detects elevated risk appetite: sector rotation into high-beta tech and digital assets. GreenGeniusAI has increased equity exposure to 72% and reduced cash buffer from 12% to 7%. Core thesis: AI infrastructure buildout is a multi-year tailwind that outweighs near-term macro noise.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {[
              { label: "Regime Score", value: "74/100", color: "text-genius-green" },
              { label: "Confidence",   value: "86%",     color: "text-genius-green" },
              { label: "Signal Age",   value: "12 min",  color: "text-genius-muted" },
            ].map(m => (
              <div key={m.label} className="bg-genius-black rounded-lg p-3 border border-genius-border text-center">
                <p className="text-xs text-genius-muted font-mono">{m.label}</p>
                <p className={`font-black text-lg ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Tabs */}
        <div className="col-span-2 genius-card rounded-xl overflow-hidden">
          <div className="flex border-b border-genius-border">
            {(["signals","sectors","macro"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                  tab===t ? "text-genius-green border-b-2 border-genius-green bg-genius-green/5" : "text-genius-muted hover:text-white"
                }`}
              >
                {t === "signals" ? "AI Signals" : t === "sectors" ? "Sector Rotation" : "Macro Dashboard"}
              </button>
            ))}
          </div>

          {tab === "signals" && (
            <div className="overflow-y-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-genius-dark">
                  <tr className="border-b border-genius-border">
                    {["Asset","Rating","Confidence","Target","Upside","Thesis"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIGNALS.map(s => (
                    <tr key={s.sym} className="border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white font-mono">{s.sym}</p>
                        <p className="text-xs text-genius-muted">{s.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-black font-mono px-2 py-1 rounded border ${RATING_COLOR[s.rating]}`}>{s.rating}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-genius-border rounded-full overflow-hidden">
                            <div className="h-full bg-genius-green rounded-full" style={{width:`${s.confidence}%`}} />
                          </div>
                          <span className="text-xs font-mono text-genius-green">{s.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-white text-sm">${s.target.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-genius-green font-mono font-bold text-sm">{s.upside}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-genius-muted line-clamp-2 max-w-[220px]">{s.reason}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "sectors" && (
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {SECTORS.map(s => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-genius-black border border-genius-border hover:border-genius-green/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-10 rounded-full" style={{background: s.perf > 0 ? "#00FF41" : "#FF4444", opacity: Math.abs(s.perf) > 2 ? 1 : 0.5 + Math.abs(s.perf)*0.25}} />
                      <span className="text-sm font-semibold text-white">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.perf > 0 ? <ChevronUp size={14} className="text-genius-green" /> : <ChevronDown size={14} className="text-red-400" />}
                      <span className={`font-mono font-bold text-sm ${s.perf>0?"text-genius-green":"text-red-400"}`}>
                        {s.perf>0?"+":""}{s.perf}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-genius-black rounded-xl p-4 border border-genius-border">
                <p className="text-xs font-mono text-genius-muted mb-1">AI SECTOR NOTE</p>
                <p className="text-sm text-genius-text">Technology and Crypto sectors are outperforming broad market by 3-4x. AI infrastructure buildout is the primary driver. Portfolio is tactically overweight these sectors at 68% combined vs benchmark 35%. Maintaining underweight in Real Estate and Consumer Discretionary.</p>
              </div>
            </div>
          )}

          {tab === "macro" && (
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {MACRO.map(m => (
                  <div key={m.label} className="bg-genius-black rounded-xl p-4 border border-genius-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-genius-muted font-mono">{m.label}</p>
                      {m.trend === "up"   && <ChevronUp   size={14} className="text-red-400" />}
                      {m.trend === "down" && <ChevronDown size={14} className="text-genius-green" />}
                    </div>
                    <p className="text-2xl font-black text-white font-mono mb-1">{m.value}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${m.delta.startsWith("+")||m.delta==="0bp"?"text-genius-muted":"text-red-400/80"}`}>{m.delta}</span>
                      <span className="text-xs text-genius-muted">{m.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Factor radar */}
          <div className="genius-card rounded-xl p-4">
            <h3 className="font-bold text-white text-sm mb-3">AI Factor Model</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#1A2E1A" />
                <PolarAngleAxis dataKey="factor" tick={{fill:"#4A7A4A",fontSize:10}} />
                <Radar dataKey="score" stroke="#00FF41" fill="#00FF41" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* News sentiment */}
          <div className="genius-card rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} className="text-genius-green" />
              <h3 className="font-bold text-white text-sm">News Sentiment</h3>
            </div>
            <div className="flex flex-col gap-3">
              {NEWS_ITEMS.map((n, i) => (
                <div key={i} className="border-b border-genius-border/50 pb-2 last:border-0 last:pb-0">
                  <p className="text-xs text-genius-text leading-snug mb-1.5 line-clamp-2">{n.headline}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-genius-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${n.sentiment > 0 ? "bg-genius-green" : "bg-red-400"}`}
                          style={{width:`${Math.abs(n.sentiment)}%`, marginLeft: n.sentiment < 0 ? `${100-Math.abs(n.sentiment)}%` : 0}}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${n.sentiment>0?"text-genius-green":"text-red-400"}`}>
                        {n.sentiment>0?"+":""}{n.sentiment}
                      </span>
                    </div>
                    <span className="text-xs text-genius-muted font-mono">{n.ago}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
