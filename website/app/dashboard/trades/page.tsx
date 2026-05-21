"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Activity, Filter, Download,
  Brain, ChevronRight, X, CheckCircle, Clock, Zap, Settings2,
} from "lucide-react";
import { getBotConfig, getActiveSymbols, type BotConfig } from "@/lib/bot-config";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

const ALL_TRADES = [
  { id: 1,  action: "BUY",  sym: "NVDA", name: "NVIDIA Corp",    qty: 2.4,   price: 875.40,  exit: null,     pnl: +312.18, pnlPct: +4.82, confidence: 94, time: "2m ago",  date: "Today",     status: "OPEN",   reason: "Earnings beat consensus by 18%. GPU demand from AI sector accelerating. RSI momentum continuation. Options flow 87% bullish." },
  { id: 2,  action: "SELL", sym: "TSLA", name: "Tesla Inc",       qty: 1.5,   price: 733.33,  exit: 733.33,   pnl: -88.00,  pnlPct: -1.12, confidence: 81, time: "14m ago", date: "Today",     status: "CLOSED", reason: "Delivery miss signals demand softening. Margin compression trend. Moving avg crossover bearish. Exiting before further downside." },
  { id: 3,  action: "BUY",  sym: "BTC",  name: "Bitcoin",         qty: 0.011, price: 77272,   exit: null,     pnl: +265.44, pnlPct: +3.41, confidence: 88, time: "31m ago", date: "Today",     status: "OPEN",   reason: "Halving cycle historically produces 6-18 month bull run. Institutional inflows at 3-month high. On-chain accumulation signal triggered." },
  { id: 4,  action: "BUY",  sym: "SOL",  name: "Solana",          qty: 3.5,   price: 177.43,  exit: null,     pnl: +174.88, pnlPct: +5.11, confidence: 79, time: "1h ago",  date: "Today",     status: "OPEN",   reason: "Network activity up 44% MoM. Developer activity surging. Breakout above key resistance with volume confirmation." },
  { id: 5,  action: "BUY",  sym: "MSFT", name: "Microsoft",       qty: 4.1,   price: 414.67,  exit: null,     pnl: +157.15, pnlPct: +1.07, confidence: 86, time: "3h ago",  date: "Today",     status: "OPEN",   reason: "Azure cloud revenue growth accelerating. Copilot AI monetization exceeding estimates. Strong institutional accumulation detected." },
  { id: 6,  action: "SELL", sym: "AMZN", name: "Amazon",          qty: 2.0,   price: 197.50,  exit: 197.50,   pnl: +441.80, pnlPct: +8.22, confidence: 91, time: "6h ago",  date: "Today",     status: "CLOSED", reason: "Took profits at key resistance level. RSI overbought at 78. AI model detected distribution pattern in options flow. Locked in 8.2% gain." },
  { id: 7,  action: "BUY",  sym: "AAPL", name: "Apple Inc",       qty: 7.2,   price: 189.42,  exit: null,     pnl: +206.82, pnlPct: +2.14, confidence: 83, time: "Yesterday",date: "Yesterday", status: "OPEN",   reason: "Services revenue growth accelerating. Vision Pro adoption curve improving. Buyback program near record levels. AI integration undervalued by market." },
  { id: 8,  action: "BUY",  sym: "META", name: "Meta Platforms",  qty: 1.8,   price: 528.11,  exit: null,     pnl: +72.90,  pnlPct: +2.08, confidence: 77, time: "Yesterday",date: "Yesterday", status: "OPEN",   reason: "Reality Labs losses stabilizing. Threads growth exceeding projections. AI ad targeting efficiency gains generating above-consensus revenue." },
  { id: 9,  action: "SELL", sym: "NVDA", name: "NVIDIA Corp",     qty: 1.2,   price: 780.00,  exit: 780.00,   pnl: +193.40, pnlPct: +7.80, confidence: 89, time: "2d ago",  date: "2d ago",    status: "CLOSED", reason: "Partial profit-take after 7.8% gain. Reducing concentration risk ahead of quarterly earnings. Maintaining core position for continued upside." },
  { id: 10, action: "BUY",  sym: "ETH",  name: "Ethereum",        qty: 0.42,  price: 3195.24, exit: null,     pnl: +88.10,  pnlPct: +2.31, confidence: 72, time: "2d ago",  date: "2d ago",    status: "OPEN",   reason: "ETF approval momentum building. Dencun upgrade reducing layer-2 fees, boosting adoption. Staking yield attractive vs risk-free rate." },
];

const PNL_CURVE = [
  { day: "Mon", pnl: 0 }, { day: "Tue", pnl: 312 }, { day: "Wed", pnl: 190 },
  { day: "Thu", pnl: 520 }, { day: "Fri", pnl: 388 }, { day: "Sat", pnl: 640 },
  { day: "Today", pnl: 1087 },
];

const WIN_BY_ASSET = [
  { sym: "NVDA", wins: 6, total: 7, rate: 86 },
  { sym: "BTC",  wins: 5, total: 6, rate: 83 },
  { sym: "MSFT", wins: 7, total: 8, rate: 88 },
  { sym: "SOL",  wins: 4, total: 5, rate: 80 },
  { sym: "TSLA", wins: 3, total: 5, rate: 60 },
  { sym: "META", wins: 5, total: 6, rate: 83 },
];

function CurveTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="text-genius-muted">{payload[0].payload.day}</p>
      <p className="text-genius-green font-bold font-mono">+${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function TradesPage() {
  const [filter,   setFilter]   = useState<"ALL"|"BUY"|"SELL"|"OPEN"|"CLOSED">("ALL");
  const [selected, setSelected] = useState<(typeof ALL_TRADES)[0] | null>(null);
  const [flash,    setFlash]    = useState(false);
  const [botCfg,   setBotCfg]   = useState<BotConfig | null>(null);
  const { open: openChart } = useTickerChart();

  useEffect(() => {
    setBotCfg(getBotConfig());
    const iv = setInterval(() => { setFlash(f => !f); }, 1500);
    return () => clearInterval(iv);
  }, []);

  const threshold    = botCfg?.confidenceThreshold ?? 80;
  const activeSyms   = botCfg ? getActiveSymbols(botCfg.assetUniverse) : null;

  // Trades pass through if:
  //  • confidence >= threshold
  //  • symbol is in active universe (or activeSyms is not yet loaded)
  const isEligible = (t: typeof ALL_TRADES[0]) => {
    if (t.confidence < threshold) return false;
    if (activeSyms && !activeSyms.includes(t.sym)) return false;
    return true;
  };

  const filtered = ALL_TRADES.filter(t => {
    if (filter === "BUY")    return t.action === "BUY";
    if (filter === "SELL")   return t.action === "SELL";
    if (filter === "OPEN")   return t.status === "OPEN";
    if (filter === "CLOSED") return t.status === "CLOSED";
    return true;
  });

  const totalPnl    = ALL_TRADES.reduce((s, t) => s + t.pnl, 0);
  const wins        = ALL_TRADES.filter(t => t.pnl > 0).length;
  const winRate     = Math.round((wins / ALL_TRADES.length) * 100);
  const avgTrade    = totalPnl / ALL_TRADES.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Trade Blotter</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${flash ? "bg-genius-green" : "bg-genius-muted"} transition-colors`} />
            Live execution log · AI-managed trades
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-genius-border text-genius-muted hover:text-white hover:border-genius-green transition-all text-sm font-semibold">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Active config banner */}
      {botCfg && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-genius-green/20 bg-genius-green/5 text-xs font-mono">
          <Brain size={13} className="text-genius-green flex-shrink-0" />
          <span className="text-genius-muted">Bot config active:</span>
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
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total P&L (7d)",    value: `+$${totalPnl.toFixed(2)}`, sub: "realized + unrealized", up: true,  icon: TrendingUp },
          { label: "Win Rate",           value: `${winRate}%`,              sub: `${wins}/${ALL_TRADES.length} trades profitable`, up: true, icon: CheckCircle },
          { label: "Avg Profit / Trade", value: `+$${avgTrade.toFixed(2)}`, sub: "per closed position",   up: true,  icon: Zap },
          { label: "Trades Today",       value: "6",                        sub: "4 open · 2 closed",      up: null,  icon: Activity },
        ].map((k, i) => (
          <div key={i} className="genius-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className="w-8 h-8 rounded-lg bg-genius-green/10 flex items-center justify-center">
                <k.icon size={14} className="text-genius-green" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className={`text-xs font-mono ${k.up === true ? "text-genius-green" : k.up === false ? "text-red-400" : "text-genius-muted"}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Cumulative P&L */}
        <div className="col-span-2 genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Cumulative P&L — This Week</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={PNL_CURVE}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00FF41" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<CurveTip />} />
              <Area type="monotone" dataKey="pnl" stroke="#00FF41" strokeWidth={2} fill="url(#pnlGrad)" dot={{fill:"#00FF41",r:3}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Win rate by asset */}
        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Win Rate by Asset</h2>
          <div className="flex flex-col gap-3">
            {WIN_BY_ASSET.map(a => (
              <div key={a.sym}>
                <div className="flex justify-between text-xs mb-1">
                  <button onClick={() => openChart(a.sym)} className="font-mono font-bold text-genius-green hover:underline">{a.sym}</button>
                  <span className={`font-mono font-bold ${a.rate >= 80 ? "text-genius-green" : a.rate >= 70 ? "text-yellow-400" : "text-red-400"}`}>{a.rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-genius-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${a.rate >= 80 ? "bg-genius-green" : a.rate >= 70 ? "bg-yellow-400" : "bg-red-400"}`}
                    style={{width:`${a.rate}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade log */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-genius-border">
          <h2 className="font-bold text-white">Execution Log</h2>
          <div className="flex gap-1">
            {(["ALL","BUY","SELL","OPEN","CLOSED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  filter===f ? "bg-genius-green/20 text-genius-green border border-genius-green/30" : "text-genius-muted hover:text-white"
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-genius-border bg-genius-dark">
              {["Side","Asset","Qty","Entry","P&L","Confidence","Status","Time",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const eligible = isEligible(t);
              return (
              <tr key={t.id}
                className={`border-b border-genius-border/40 cursor-pointer transition-colors ${eligible ? "hover:bg-genius-card" : "opacity-40 hover:opacity-60"}`}
                onClick={() => setSelected(t)}
                title={!eligible ? (t.confidence < threshold ? `Below ${threshold}% confidence threshold` : "Symbol not in active universe") : ""}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded text-xs font-black font-mono ${
                      t.action==="BUY" ? "bg-genius-green/15 text-genius-green border border-genius-green/25" : "bg-red-500/15 text-red-400 border border-red-500/25"
                    }`}>{t.action}</span>
                    {!eligible && (
                      <span className="text-xs font-mono text-genius-muted/70 border border-genius-border rounded px-1">
                        {t.confidence < threshold ? `below ${threshold}%` : "excluded"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3" onClick={e => { e.stopPropagation(); openChart(t.sym); }}>
                  <p className="font-bold text-genius-green hover:underline cursor-pointer font-mono text-sm">{t.sym}</p>
                  <p className="text-xs text-genius-muted">{t.name}</p>
                </td>
                <td className="px-4 py-3 font-mono text-genius-text text-sm">{t.qty}</td>
                <td className="px-4 py-3 font-mono text-genius-text text-sm">${t.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <p className={`font-mono font-bold text-sm ${t.pnl>0?"text-genius-green":"text-red-400"}`}>
                    {t.pnl>0?"+":""}${t.pnl.toFixed(2)}
                  </p>
                  <p className={`text-xs font-mono ${t.pnlPct>0?"text-genius-green/70":"text-red-400/70"}`}>
                    {t.pnlPct>0?"+":""}{t.pnlPct}%
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-genius-border rounded-full overflow-hidden">
                      <div className="h-full bg-genius-green rounded-full" style={{width:`${t.confidence}%`}} />
                    </div>
                    <span className="text-xs font-mono text-genius-green">{t.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    t.status==="OPEN" ? "bg-genius-green/10 text-genius-green border border-genius-green/20" : "bg-genius-border text-genius-muted"
                  }`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-genius-muted font-mono">{t.time}</td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-genius-muted" /></td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trade detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="genius-card rounded-2xl p-6 max-w-lg w-full border border-genius-border glow-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Trade Detail</h3>
              <button onClick={() => setSelected(null)} className="text-genius-muted hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Symbol", value: selected.sym, mono: true, clickable: true },
                { label: "Action", value: selected.action, color: selected.action==="BUY"?"text-genius-green":"text-red-400" },
                { label: "Qty",    value: String(selected.qty), mono: true },
                { label: "Entry",  value: `$${selected.price.toLocaleString()}`, mono: true },
                { label: "P&L",    value: `${selected.pnl>0?"+":""}$${selected.pnl.toFixed(2)}`, color: selected.pnl>0?"text-genius-green":"text-red-400" },
                { label: "Status", value: selected.status },
              ].map(d => (
                <div key={d.label} className="bg-genius-black rounded-lg p-3 border border-genius-border">
                  <p className="text-xs text-genius-muted font-mono mb-1">{d.label}</p>
                  {(d as any).clickable
                    ? <button onClick={() => openChart(selected.sym)} className="font-bold text-sm text-genius-green hover:underline font-mono">{d.value}</button>
                    : <p className={`font-bold text-sm ${(d as any).color || "text-white"} ${(d as any).mono ? "font-mono" : ""}`}>{d.value}</p>
                  }
                </div>
              ))}
            </div>
            <div className="bg-genius-black rounded-xl p-4 border border-genius-green/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-genius-green" />
                <span className="text-xs font-mono font-bold text-genius-green">AI REASONING</span>
                <span className="ml-auto text-xs text-genius-muted font-mono">{selected.confidence}% confidence</span>
              </div>
              <p className="text-sm text-genius-text leading-relaxed">{selected.reason}</p>
            </div>
            <div className="w-full h-2 bg-genius-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-genius-green to-genius-emerald rounded-full transition-all" style={{width:`${selected.confidence}%`}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
