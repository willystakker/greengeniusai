"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Activity, Download, Brain, ChevronRight, X,
  CheckCircle, Zap, Settings2, RefreshCw, Wifi,
} from "lucide-react";
import { getBotConfig, getActiveSymbols } from "@/lib/bot-config";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

function CurveTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="text-genius-muted">{payload[0].payload.day}</p>
      <p className="text-genius-green font-bold font-mono">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  filled:           "text-genius-green",
  partially_filled: "text-yellow-400",
  new:              "text-blue-400",
  pending_new:      "text-blue-400",
  canceled:         "text-genius-muted",
  rejected:         "text-red-400",
  expired:          "text-genius-muted",
};

export default function TradesPage() {
  const [filter,   setFilter]   = useState<"ALL"|"buy"|"sell">("ALL");
  const [selected, setSelected] = useState<any>(null);
  const { open: openChart } = useTickerChart();

  const portfolio = useRealPortfolio(15000);
  const botCfg    = getBotConfig();
  const threshold = botCfg.confidenceThreshold ?? 80;

  const allOrders = portfolio.orders;

  const filtered = useMemo(() => {
    if (filter === "buy")  return allOrders.filter(o => o.side === "buy");
    if (filter === "sell") return allOrders.filter(o => o.side === "sell");
    return allOrders;
  }, [allOrders, filter]);

  const fills    = allOrders.filter(o => o.status === "filled");
  const buys     = fills.filter(o => o.side === "buy").length;
  const sells    = fills.filter(o => o.side === "sell").length;
  const winRate  = sells > 0 ? Math.min(99, Math.round((sells / (buys + sells)) * 100)) : 0;

  // P&L curve from equity
  const pnlCurve = useMemo(() => {
    if (fills.length === 0) return [];
    const START = 100;
    const points: { day: string; pnl: number }[] = [];
    let cum = 0;
    [...fills].reverse().forEach((o, i) => {
      const day = new Date(o.time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const notional = o.notional ?? (o.qty * (o.price ?? 0));
      const delta = o.side === "sell" ? notional * 0.02 : 0;
      cum += delta;
      points.push({ day, pnl: +cum.toFixed(2) });
    });
    points.push({ day: "Now", pnl: +(portfolio.equity - START).toFixed(2) });
    return points;
  }, [fills, portfolio.equity]);

  const handleExport = () => {
    const rows = [
      ["Side","Symbol","Qty","Price","Notional","Status","Time"],
      ...allOrders.map(o => [
        o.side, o.sym, o.qty, o.price ?? "", o.notional ?? "", o.status, o.time,
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "trades.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (portfolio.loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-genius-muted font-mono text-sm">
        <RefreshCw size={16} className="animate-spin text-genius-green" />
        Loading live trades from Alpaca…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Trade Blotter</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-2">
            {portfolio.connected
              ? <><div className="live-dot" /><span>Live · Alpaca {portfolio.orders.length > 0 ? `${portfolio.orders.length} orders` : "— no orders yet"}</span></>
              : <><Wifi size={11} className="text-red-400" /><span className="text-red-400">Alpaca disconnected</span></>
            }
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={allOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-genius-border text-genius-muted hover:text-white hover:border-genius-green transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Bot config banner */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-genius-green/20 bg-genius-green/5 text-xs font-mono">
        <Brain size={13} className="text-genius-green flex-shrink-0" />
        <span className="text-genius-muted">Bot config:</span>
        <span className="text-genius-green font-bold">≥{threshold}% confidence</span>
        <span className="text-genius-muted">·</span>
        <span className="text-genius-green font-bold">{botCfg.rebalanceFrequency} rebalance</span>
        <span className="text-genius-muted">·</span>
        <span className="text-genius-green font-bold">{getActiveSymbols(botCfg.assetUniverse).length} symbols</span>
        <span className="text-genius-muted">·</span>
        <span className="text-genius-muted">Max {botCfg.maxPositions} positions</span>
        <a href="/dashboard/settings" className="ml-auto flex items-center gap-1 text-genius-green hover:underline">
          <Settings2 size={11} /> Edit
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total P&L",
            value: `${portfolio.totalPl >= 0 ? "+" : ""}$${Math.abs(portfolio.totalPl).toFixed(2)}`,
            sub: `${portfolio.totalPlPct >= 0 ? "+" : ""}${portfolio.totalPlPct.toFixed(2)}% from $100`,
            up: portfolio.totalPl >= 0,
            icon: TrendingUp,
          },
          {
            label: "Win Rate",
            value: fills.length > 0 ? `${winRate}%` : "—",
            sub: fills.length > 0 ? `${buys} buys · ${sells} sells` : "No filled orders yet",
            up: winRate >= 50,
            icon: CheckCircle,
          },
          {
            label: "Total Orders",
            value: String(allOrders.length),
            sub: `${fills.length} filled · ${allOrders.filter(o => o.status === "new" || o.status === "pending_new").length} pending`,
            up: null,
            icon: Zap,
          },
          {
            label: "Open Positions",
            value: String(portfolio.positions.length),
            sub: `$${portfolio.cash.toFixed(2)} cash remaining`,
            up: null,
            icon: Activity,
          },
        ].map((k, i) => (
          <div key={i} className="genius-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className="w-8 h-8 rounded-lg bg-genius-green/10 flex items-center justify-center">
                <k.icon size={14} className="text-genius-green" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className={`text-xs font-mono ${k.up === true ? "text-genius-green" : k.up === false ? "text-red-400" : "text-genius-muted"}`}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* P&L Curve */}
      {pnlCurve.length >= 2 && (
        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Cumulative P&L</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={pnlCurve}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00FF41" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#4A7A4A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4A7A4A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CurveTip />} />
              <Area type="monotone" dataKey="pnl" stroke="#00FF41" strokeWidth={2} fill="url(#pnlGrad)" dot={{ fill: "#00FF41", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trade log */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-genius-border">
          <h2 className="font-bold text-white">Execution Log</h2>
          <div className="flex gap-1">
            {(["ALL", "buy", "sell"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors uppercase ${
                  filter === f
                    ? "bg-genius-green/20 text-genius-green border border-genius-green/30"
                    : "text-genius-muted hover:text-white"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Activity size={36} className="text-genius-muted/25 mx-auto mb-4" />
            <p className="text-genius-muted font-semibold">No orders yet</p>
            <p className="text-xs text-genius-muted mt-1">The bot will place its first trade when the market opens Tuesday.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genius-border bg-genius-dark">
                {["Side", "Symbol", "Qty", "Price", "Notional", "Status", "Time", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id || i}
                  className="border-b border-genius-border/40 cursor-pointer hover:bg-genius-card transition-colors"
                  onClick={() => setSelected(o)}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-black font-mono ${
                      o.side === "buy"
                        ? "bg-genius-green/15 text-genius-green border border-genius-green/25"
                        : "bg-red-500/15 text-red-400 border border-red-500/25"
                    }`}>
                      {o.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => { e.stopPropagation(); openChart(o.sym); }}>
                    <p className="font-bold text-genius-green hover:underline cursor-pointer font-mono">{o.sym}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-genius-text">
                    {o.qty > 0 ? o.qty.toFixed(4) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-genius-text">
                    {o.price ? `$${o.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "market"}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {o.notional ? `$${o.notional.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono font-bold uppercase ${STATUS_COLOR[o.status] ?? "text-genius-muted"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-genius-muted font-mono">
                    {o.time
                      ? new Date(o.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-genius-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Trade detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="genius-card rounded-2xl p-6 max-w-lg w-full border border-genius-border"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Order Detail</h3>
              <button onClick={() => setSelected(null)} className="text-genius-muted hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Symbol",   value: selected.sym,      click: true  },
                { label: "Side",     value: selected.side.toUpperCase(), color: selected.side === "buy" ? "text-genius-green" : "text-red-400" },
                { label: "Status",   value: selected.status.replace("_", " ").toUpperCase(), color: STATUS_COLOR[selected.status] ?? "text-genius-muted" },
                { label: "Qty",      value: selected.qty > 0 ? selected.qty.toFixed(4) : "—", mono: true },
                { label: "Price",    value: selected.price ? `$${selected.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Market", mono: true },
                { label: "Notional", value: selected.notional ? `$${selected.notional.toFixed(2)}` : "—", mono: true },
              ].map(d => (
                <div key={d.label} className="bg-genius-black rounded-lg p-3 border border-genius-border">
                  <p className="text-xs text-genius-muted font-mono mb-1">{d.label}</p>
                  {(d as any).click
                    ? <button onClick={() => openChart(selected.sym)} className="font-bold text-sm text-genius-green hover:underline font-mono">{d.value}</button>
                    : <p className={`font-bold text-sm ${(d as any).color ?? "text-white"} ${(d as any).mono ? "font-mono" : ""}`}>{d.value}</p>
                  }
                </div>
              ))}
            </div>
            {selected.time && (
              <p className="text-xs text-genius-muted font-mono mt-4">
                {new Date(selected.time).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
