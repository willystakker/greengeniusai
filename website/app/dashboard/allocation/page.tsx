"use client";

import { useState, useMemo } from "react";
import { getBotConfig, nextRebalanceDate, type BotConfig } from "@/lib/bot-config";
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Sliders, Wifi } from "lucide-react";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="font-bold text-white font-mono">{d.sym}</p>
      <p className="text-genius-muted">${d.value.toFixed(2)}</p>
      <p className="text-genius-green font-mono font-bold">{d.pct.toFixed(1)}%</p>
    </div>
  );
}

export default function AllocationPage() {
  const [driftThreshold, setDriftThreshold] = useState(5);
  const [autoRebalance,  setAutoRebalance]  = useState(true);
  const [rebalancing,    setRebalancing]    = useState(false);

  const portfolio = useRealPortfolio(15000);
  const { open: openChart } = useTickerChart();
  const botCfg = getBotConfig();

  // Build positions with allocation percentages
  const positions = useMemo(() => {
    if (!portfolio.connected || portfolio.positions.length === 0) return [];

    const cashEntry = {
      sym: "CASH", name: "Cash & Equiv",
      qty: 1, entry: portfolio.cash, current: portfolio.cash,
      pl: 0, plPct: 0, value: portfolio.cash,
      color: "#4A7A4A", class: "Cash" as const,
    };

    const all = [...portfolio.positions, ...(portfolio.cash > 0.01 ? [cashEntry] : [])];
    const total = all.reduce((s, p) => s + p.value, 0);

    return all.map(p => ({
      ...p,
      pct: total > 0 ? (p.value / total) * 100 : 0,
    }));
  }, [portfolio]);

  const totalValue  = positions.reduce((s, p) => s + p.value, 0);
  const equityPct   = positions.filter(p => p.class === "Equity").reduce((s, p) => s + p.pct, 0);
  const cryptoPct   = positions.filter(p => p.class === "Crypto").reduce((s, p) => s + p.pct, 0);
  const cashPct     = positions.filter(p => p.class === "Cash"  ).reduce((s, p) => s + p.pct, 0);

  const handleRebalance = () => {
    setRebalancing(true);
    setTimeout(() => setRebalancing(false), 2000);
  };

  if (portfolio.loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-genius-muted font-mono text-sm">
        <RefreshCw size={16} className="animate-spin text-genius-green" />
        Loading live allocation from Alpaca…
      </div>
    );
  }

  const noPositions = portfolio.connected && portfolio.positions.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Allocation Manager</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-2">
            {portfolio.connected
              ? <><div className="live-dot" /><span>Live Alpaca · {portfolio.positions.length} positions · ${portfolio.equity.toFixed(2)} equity</span></>
              : <><Wifi size={11} className="text-red-400" /><span className="text-red-400">Alpaca disconnected</span></>
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-genius-muted">
            <span className="text-genius-green font-bold">{botCfg.rebalanceFrequency}</span>
            <span>· Next:</span>
            <span className="text-genius-green font-bold">{nextRebalanceDate(botCfg.rebalanceFrequency)}</span>
          </div>
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
            disabled={rebalancing || noPositions}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold disabled:opacity-60"
          >
            <RefreshCw size={14} className={rebalancing ? "animate-spin" : ""} />
            {rebalancing ? "Rebalancing..." : "Rebalance Now"}
          </button>
        </div>
      </div>

      {/* No positions yet */}
      {noPositions ? (
        <div className="genius-card rounded-xl p-12 text-center border border-genius-green/10">
          <TrendingUp size={40} className="text-genius-muted/30 mx-auto mb-4" />
          <p className="text-white font-bold mb-2">No open positions yet</p>
          <p className="text-xs text-genius-muted font-mono">
            Balance: <span className="text-genius-green font-bold">${portfolio.equity.toFixed(2)}</span> ·
            Cash: <span className="text-genius-green font-bold">${portfolio.cash.toFixed(2)}</span>
          </p>
          <p className="text-xs text-genius-muted mt-2">The bot will open positions when the market opens Tuesday.</p>
        </div>
      ) : (
        <>
          {/* Asset class summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Equities", pct: equityPct, color: "text-genius-green",   bg: "bg-genius-green/10",   border: "border-genius-green/20"   },
              { label: "Crypto",   pct: cryptoPct, color: "text-genius-emerald", bg: "bg-genius-emerald/10", border: "border-genius-emerald/20" },
              { label: "Cash",     pct: cashPct,   color: "text-genius-muted",   bg: "bg-genius-card",       border: "border-genius-border"     },
            ].map(c => (
              <div key={c.label} className={`genius-card rounded-xl p-5 border ${c.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-genius-muted font-mono">{c.label.toUpperCase()}</p>
                </div>
                <p className={`text-3xl font-black mb-2 ${c.color}`}>{c.pct.toFixed(1)}%</p>
                <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${c.label === "Equities" ? "bg-genius-green" : c.label === "Crypto" ? "bg-genius-emerald" : "bg-genius-muted"}`}
                    style={{ width: `${Math.min(c.pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-genius-muted font-mono">
                  ${positions.filter(p => p.class === c.label || (c.label === "Cash" && p.class === "Cash")).reduce((s, p) => s + p.value, 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="grid grid-cols-5 gap-6">
            {/* Pie chart */}
            <div className="col-span-2 genius-card rounded-xl p-5 flex flex-col">
              <h2 className="font-bold text-white mb-1">Current Allocation</h2>
              <p className="text-xs text-genius-muted font-mono mb-4">
                Total: ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={positions} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="pct">
                    {positions.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {positions.map(p => (
                  <div key={p.sym} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-genius-muted font-mono">{p.sym}</span>
                    <span className="text-white font-mono ml-auto">{p.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Position table */}
            <div className="col-span-3 genius-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-genius-border flex items-center justify-between">
                <h2 className="font-bold text-white">Positions</h2>
                <div className="flex items-center gap-2">
                  <Sliders size={13} className="text-genius-muted" />
                  <span className="text-xs text-genius-muted font-mono">Drift threshold:</span>
                  <div className="flex gap-1">
                    {[3, 5, 10].map(v => (
                      <button key={v} onClick={() => setDriftThreshold(v)}
                        className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${driftThreshold === v ? "bg-genius-green text-genius-black font-bold" : "text-genius-muted hover:text-white"}`}>
                        {v}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[420px]">
                {positions.map(p => {
                  const pl      = p.pl;
                  const plPct   = p.plPct;
                  const isUp    = pl >= 0;
                  return (
                    <div key={p.sym} className="px-5 py-4 border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                          <div>
                            <button
                              onClick={() => p.sym !== "CASH" && openChart(p.sym)}
                              className={p.sym !== "CASH" ? "font-bold text-genius-green hover:underline font-mono text-sm" : "font-bold text-white font-mono text-sm"}>
                              {p.sym}
                            </button>
                            <span className="text-xs text-genius-muted ml-2">{p.class}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-bold ${isUp ? "text-genius-green" : "text-red-400"}`}>
                            {isUp ? "+" : ""}${pl.toFixed(2)} ({isUp ? "+" : ""}{plPct.toFixed(2)}%)
                          </span>
                          <span className="text-sm font-bold text-white font-mono">${p.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs font-mono text-genius-muted">
                        <span>Qty: <span className="text-white">{p.qty.toFixed(p.sym === "CASH" ? 2 : 6)}</span></span>
                        <span>Entry: <span className="text-white">${p.entry.toFixed(2)}</span></span>
                        <span>Now: <span className="text-white">${p.current.toFixed(2)}</span></span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-genius-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p.pct, 100)}%`, background: p.color }} />
                        </div>
                        <p className="text-[10px] text-genius-muted font-mono mt-0.5">{p.pct.toFixed(1)}% of portfolio</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
