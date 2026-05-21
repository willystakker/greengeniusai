"use client";

import { useState, useEffect, useMemo } from "react";
import { getBotConfig, nextRebalanceDate, type BotConfig } from "@/lib/bot-config";
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Sliders } from "lucide-react";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const BASE_POSITIONS = [
  { sym: "NVDA", name: "NVIDIA Corp",    shares: 2.4,   entry: 875.39, target: 15, class: "Equity",  color: "#00FF41" },
  { sym: "BTC",  name: "Bitcoin",        shares: 0.031, entry: 68240,  target: 15, class: "Crypto",  color: "#00D97E" },
  { sym: "MSFT", name: "Microsoft",      shares: 4.1,   entry: 414.67, target: 14, class: "Equity",  color: "#7FFF00" },
  { sym: "SOL",  name: "Solana",         shares: 9.7,   entry: 178.44, target: 12, class: "Crypto",  color: "#00BCD4" },
  { sym: "AAPL", name: "Apple Inc",      shares: 7.2,   entry: 189.42, target: 12, class: "Equity",  color: "#FFD700" },
  { sym: "META", name: "Meta Platforms", shares: 1.8,   entry: 528.11, target: 8,  class: "Equity",  color: "#FF6B6B" },
  { sym: "AMD",  name: "AMD",            shares: 4.8,   entry: 150.00, target: 7,  class: "Equity",  color: "#C084FC" },
  { sym: "ETH",  name: "Ethereum",       shares: 0.13,  entry: 3884,   target: 8,  class: "Crypto",  color: "#38BDF8" },
  { sym: "CASH", name: "Cash & Equiv",   shares: 1,     entry: 885.50, target: 9,  class: "Cash",    color: "#4A7A4A" },
];

const CLASS_COLORS: Record<string,string> = { Equity: "#00FF41", Crypto: "#00D97E", Cash: "#4A7A4A" };

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="font-bold text-white font-mono">{d.sym}</p>
      <p className="text-genius-muted">{d.name}</p>
      <p className="text-genius-green font-mono font-bold">{d.actual}%</p>
    </div>
  );
}

export default function AllocationPage() {
  const [driftThreshold, setDriftThreshold] = useState(5);
  const [autoRebalance,  setAutoRebalance]  = useState(true);
  const [rebalancing,    setRebalancing]    = useState(false);
  const [botCfg,         setBotCfg]         = useState<BotConfig | null>(null);

  const { prices, lastUpdated } = useLivePrices(20000);
  const { open: openChart } = useTickerChart();

  useEffect(() => {
    const cfg = getBotConfig();
    setBotCfg(cfg);
    setAutoRebalance(cfg.botActive);
  }, []);

  const POSITIONS = useMemo(() => {
    const live = BASE_POSITIONS.map(p => {
      if (p.sym === "CASH") return { ...p, value: p.entry };
      const px = prices[p.sym];
      return { ...p, value: px ? +(p.shares * px.priceNum).toFixed(2) : +(p.shares * p.entry).toFixed(2) };
    });
    const total = live.reduce((s, p) => s + p.value, 0);
    return live.map(p => ({ ...p, actual: +((p.value / total) * 100).toFixed(1) }));
  }, [prices]);

  const totalValue = POSITIONS.reduce((s, p) => s + p.value, 0);

  const equityPct = POSITIONS.filter(p=>p.class==="Equity").reduce((s,p)=>s+p.actual,0);
  const cryptoPct = POSITIONS.filter(p=>p.class==="Crypto").reduce((s,p)=>s+p.actual,0);
  const cashPct   = POSITIONS.filter(p=>p.class==="Cash"  ).reduce((s,p)=>s+p.actual,0);

  const drifted = POSITIONS.filter(p => Math.abs(p.actual - p.target) > driftThreshold);

  const handleRebalance = () => {
    setRebalancing(true);
    setTimeout(() => setRebalancing(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Allocation Manager</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">Target vs actual · Drift monitoring · Rebalance controls</p>
        </div>
        <div className="flex items-center gap-3">
          {botCfg && (
            <div className="flex items-center gap-2 text-xs font-mono text-genius-muted">
              <span className="text-genius-green font-bold">{botCfg.rebalanceFrequency}</span>
              <span>· Next:</span>
              <span className="text-genius-green font-bold">{nextRebalanceDate(botCfg.rebalanceFrequency)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-genius-border">
            <span className="text-xs text-genius-muted font-mono">AUTO REBALANCE</span>
            <button
              onClick={() => setAutoRebalance(a => !a)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoRebalance ? "bg-genius-green" : "bg-genius-border"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRebalance ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <button
            onClick={handleRebalance}
            disabled={rebalancing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold disabled:opacity-60"
          >
            <RefreshCw size={14} className={rebalancing ? "animate-spin" : ""} />
            {rebalancing ? "Rebalancing..." : "Rebalance Now"}
          </button>
        </div>
      </div>

      {/* Asset class summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Equities", pct: equityPct, target: 56, color: "text-genius-green", bg: "bg-genius-green/10", border: "border-genius-green/20" },
          { label: "Crypto",   pct: cryptoPct, target: 33, color: "text-genius-emerald", bg: "bg-genius-emerald/10", border: "border-genius-emerald/20" },
          { label: "Cash",     pct: cashPct,   target: 9,  color: "text-genius-muted",  bg: "bg-genius-card", border: "border-genius-border" },
        ].map(c => (
          <div key={c.label} className={`genius-card rounded-xl p-5 border ${c.border}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{c.label.toUpperCase()}</p>
              <span className={`text-xs font-mono ${c.color}`}>Target {c.target}%</span>
            </div>
            <p className={`text-3xl font-black mb-2 ${c.color}`}>{c.pct.toFixed(1)}%</p>
            <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full transition-all ${c.label==="Equities"?"bg-genius-green":c.label==="Crypto"?"bg-genius-emerald":"bg-genius-muted"}`} style={{width:`${Math.min(c.pct,100)}%`}} />
            </div>
            <p className="text-xs text-genius-muted font-mono">
              Drift: {(c.pct - c.target) > 0 ? "+" : ""}{(c.pct - c.target).toFixed(1)}%
              {Math.abs(c.pct - c.target) > driftThreshold && " ⚠️"}
            </p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Pie chart */}
        <div className="col-span-2 genius-card rounded-xl p-5 flex flex-col">
          <h2 className="font-bold text-white mb-1">Current Allocation</h2>
          <p className="text-xs text-genius-muted font-mono mb-4">Total: ${totalValue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={POSITIONS} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="actual">
                {POSITIONS.map((p,i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {POSITIONS.map(p => (
              <div key={p.sym} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:p.color}} />
                <span className="text-genius-muted font-mono">{p.sym}</span>
                <span className="text-white font-mono ml-auto">{p.actual}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drift table */}
        <div className="col-span-3 genius-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-genius-border flex items-center justify-between">
            <h2 className="font-bold text-white">Target vs Actual</h2>
            <div className="flex items-center gap-2">
              <Sliders size={13} className="text-genius-muted" />
              <span className="text-xs text-genius-muted font-mono">Drift threshold:</span>
              <div className="flex gap-1">
                {[3, 5, 10].map(v => (
                  <button key={v} onClick={() => setDriftThreshold(v)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${driftThreshold===v?"bg-genius-green text-genius-black font-bold":"text-genius-muted hover:text-white"}`}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            {POSITIONS.map(p => {
              const drift = p.actual - p.target;
              const absDrift = Math.abs(drift);
              const needsAction = absDrift > driftThreshold;
              return (
                <div key={p.sym} className={`px-5 py-4 border-b border-genius-border/40 hover:bg-genius-card transition-colors ${needsAction ? "bg-yellow-500/3" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:p.color}} />
                      <div>
                        <button onClick={() => p.sym !== "CASH" && openChart(p.sym)} className={p.sym !== "CASH" ? "font-bold text-genius-green hover:underline font-mono text-sm" : "font-bold text-white font-mono text-sm"}>{p.sym}</button>
                        <span className="text-xs text-genius-muted ml-2">{p.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {needsAction ? (
                        <AlertTriangle size={13} className="text-yellow-400" />
                      ) : (
                        <CheckCircle size={13} className="text-genius-green" />
                      )}
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        needsAction ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-genius-green/10 text-genius-green border border-genius-green/20"
                      }`}>
                        {drift > 0 ? "+" : ""}{drift.toFixed(1)}% drift
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-genius-muted font-mono">Target</span>
                        <span className="text-genius-muted font-mono font-bold">{p.target}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-genius-border rounded-full">
                        <div className="h-full bg-genius-muted/50 rounded-full" style={{width:`${p.target}%`}} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-genius-muted font-mono">Actual</span>
                        <span className="text-white font-mono font-bold">{p.actual}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-genius-border rounded-full">
                        <div className="h-full rounded-full transition-all" style={{width:`${p.actual}%`, background:p.color}} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drift alerts */}
      {drifted.length > 0 && (
        <div className="genius-card rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-yellow-400" />
            <h3 className="font-bold text-white text-sm">{drifted.length} Position{drifted.length>1?"s":""} Need Rebalancing</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {drifted.map(p => (
              <div key={p.sym} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-genius-black border border-yellow-400/20">
                <span className="font-mono font-bold text-white text-sm">{p.sym}</span>
                <span className={`text-xs font-mono ${p.actual > p.target ? "text-yellow-400" : "text-blue-400"}`}>
                  {p.actual > p.target ? "Overweight" : "Underweight"} {Math.abs(p.actual - p.target).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-genius-muted mt-3">
            {autoRebalance ? "Auto-rebalance will trigger on next scheduled run." : "Auto-rebalance is disabled. Click \"Rebalance Now\" to realign positions."}
          </p>
        </div>
      )}
    </div>
  );
}
