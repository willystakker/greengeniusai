"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, TrendingUp, DollarSign, Bell, Plus,
  Activity, List, RefreshCw, Newspaper,
  Bot, BarChart3, ChevronRight,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { getUser } from "@/lib/auth";

const PIE_COLORS = ["#00FF41","#00D97E","#7FFF00","#00BCD4","#FFD700","#FF6B6B","#4A7A4A"];
const GOAL       = 175;
const START      = 100;

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="text-genius-muted">{payload[0].payload.label}</p>
      <p className="text-genius-green font-bold font-mono">${Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { open: openChart } = useTickerChart();

  const [userName,   setUserName]   = useState("Jaden");
  const [tab,        setTab]        = useState<"positions"|"orders"|"log">("positions");
  const [portfolio,  setPortfolio]  = useState<any>(null);
  const [botLog,     setBotLog]     = useState<any>(null);
  const [news,       setNews]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/auth"); return; }
    setUserName(user.name?.split(" ")[0] || "Jaden");
  }, [router]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        setPortfolio(await res.json());
        setLastUpdate(new Date());
      }
    } catch {}
    setLoading(false);
  }, []);

  const fetchBotLog = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/activity");
      if (res.ok) setBotLog(await res.json());
    } catch {}
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const syms = portfolio?.positions?.length
        ? portfolio.positions.slice(0, 3).map((p: any) => p.symbol)
        : ["NVDA","AAPL","MSFT"];
      const all = await Promise.all(syms.map(async (sym: string) => {
        try {
          const r = await fetch(`/api/news?sym=${sym}`);
          const d = await r.json();
          return (d.news ?? []).slice(0, 2).map((n: any) => ({ ...n, sym }));
        } catch { return []; }
      }));
      const flat = all.flat() as any[];
      flat.sort((a, b) => b.publishedAt - a.publishedAt);
      const seen = new Set<string>();
      setNews(flat.filter(n => { if (seen.has(n.title)) return false; seen.add(n.title); return true; }).slice(0, 5));
    } catch {}
  }, [portfolio?.positions]);

  useEffect(() => {
    fetchPortfolio();
    fetchBotLog();
    const iv1 = setInterval(fetchPortfolio, 15000);
    const iv2 = setInterval(fetchBotLog, 30000);
    return () => { clearInterval(iv1); clearInterval(iv2); };
  }, [fetchPortfolio, fetchBotLog]);

  useEffect(() => {
    fetchNews();
    const iv = setInterval(fetchNews, 60000);
    return () => clearInterval(iv);
  }, [fetchNews]);

  const equity    = portfolio?.equity    ?? 0;
  const cash      = portfolio?.cash      ?? 0;
  const positions = portfolio?.positions ?? [];
  const orders    = portfolio?.orders    ?? [];
  const connected = portfolio?.connected ?? false;
  const goalPct   = Math.min((equity / GOAL) * 100, 100);
  const totalGain = equity - START;
  const totalGainPct = START > 0 ? ((totalGain / START) * 100).toFixed(2) : "0.00";

  // Chart: start $100, plot order fills, end at current equity
  const chartData = (() => {
    const filled = orders.filter((o: any) => o.status === "filled" && o.price).reverse();
    if (filled.length === 0) return [{ label: "Start", value: START }, { label: "Now", value: equity || START }];
    const pts = [{ label: "Start", value: START }];
    filled.forEach((o: any, i: number) => pts.push({ label: `Trade ${i + 1}`, value: o.price }));
    pts.push({ label: "Now", value: equity });
    return pts;
  })();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Welcome back, {userName}</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-1.5">
            {loading
              ? <><RefreshCw size={10} className="animate-spin" /> Connecting...</>
              : connected
                ? <><span className="w-1.5 h-1.5 rounded-full bg-genius-green inline-block" /> Live · {lastUpdate?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</>
                : <><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Disconnected</>
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { fetchPortfolio(); fetchBotLog(); }}
            className="px-4 py-2 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link href="/dashboard/add-funds" className="px-4 py-2 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
            <Plus size={14} /> Add Funds
          </Link>
        </div>
      </div>

      {/* Goal bar */}
      <div className="genius-card rounded-xl p-4 border border-genius-green/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">Goal: $100 → $175</span>
          <span className="text-sm font-black text-genius-green font-mono">${equity.toFixed(2)} / $175.00</span>
        </div>
        <div className="w-full h-2.5 bg-genius-border rounded-full overflow-hidden">
          <div className="h-full bg-genius-green rounded-full transition-all duration-700" style={{ width: `${goalPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs font-mono">
          <span className="text-genius-muted">$100 start</span>
          <span className="text-genius-green font-bold">{goalPct.toFixed(1)}% there</span>
          <span className="text-genius-muted">$175 goal</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Live Balance",    value: `$${equity.toFixed(2)}`,    sub: `${totalGain >= 0 ? "+" : ""}${totalGainPct}% from $100`,                icon: DollarSign,  up: totalGain >= 0 },
          { label: "Cash Available",  value: `$${cash.toFixed(2)}`,      sub: `$${(equity - cash).toFixed(2)} deployed`,                               icon: TrendingUp,  up: null },
          { label: "Open Positions",  value: String(positions.length),   sub: positions.length > 0 ? positions.map((p: any) => p.symbol).join(", ") : "Bot scanning 6,843 stocks", icon: List, up: null },
          { label: "Bot Scans",       value: botLog ? `${(botLog.stocks_scanned || 0).toLocaleString()}` : "—", sub: botLog ? `${botLog.trades?.length ?? 0} trades logged` : "Starts Tuesday 9:30 AM ET", icon: Bot, up: null },
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

      {/* Chart + Allocation */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 genius-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Portfolio Growth</h2>
            <span className="text-xs text-genius-muted font-mono">Live Alpaca · $100 start</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00FF41" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: "#4A7A4A", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4A7A4A", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${Number(v).toFixed(0)}`}
                domain={[90, Math.max(180, (equity || START) + 20)]} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#00FF41" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Allocation</h2>
          {positions.length > 0 ? (
            <>
              <RPieChart width={180} height={140}>
                <Pie data={positions.map((p: any) => ({ name: p.symbol, value: p.value }))}
                  cx={90} cy={65} innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value">
                  {positions.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </RPieChart>
              <div className="flex flex-col gap-1.5 mt-2">
                {positions.slice(0, 5).map((p: any, i: number) => (
                  <div key={p.symbol} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <button onClick={() => openChart(p.symbol)} className="text-genius-muted font-mono hover:text-genius-green">{p.symbol}</button>
                    </div>
                    <span className="text-white font-mono">{equity > 0 ? ((p.value / equity) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <Bot size={28} className="text-genius-muted/30 mb-3" />
              <p className="text-sm text-genius-muted text-center">Scanning 6,843 stocks</p>
              <p className="text-xs text-genius-muted mt-1 font-mono">Positions show after first trade</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex border-b border-genius-border">
          {(["positions","orders","log"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "text-genius-green border-b-2 border-genius-green bg-genius-green/5" : "text-genius-muted hover:text-white"
              }`}>
              {t === "positions" ? `Positions (${positions.length})`
               : t === "orders"    ? `Orders (${orders.length})`
               :                     "Bot Log"}
            </button>
          ))}
        </div>

        {tab === "positions" && (
          positions.length === 0
            ? <div className="p-12 text-center"><Bot size={32} className="text-genius-muted/30 mx-auto mb-3" /><p className="text-genius-muted text-sm">No open positions yet — bot starts Tuesday 9:30 AM ET.</p></div>
            : <table className="w-full text-sm">
                <thead><tr className="border-b border-genius-border">
                  {["Symbol","Qty","Entry","Current","Value","P&L"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {positions.map((p: any) => (
                    <tr key={p.symbol} className="border-b border-genius-border/50 hover:bg-genius-card">
                      <td className="px-4 py-3"><button onClick={() => openChart(p.symbol)} className="font-bold font-mono text-genius-green hover:underline">{p.symbol}</button></td>
                      <td className="px-4 py-3 font-mono text-genius-text">{Number(p.qty).toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono text-genius-text">${Number(p.entry).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-white">${Number(p.current).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-white">${Number(p.value).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <p className={`font-mono font-bold ${Number(p.pl) >= 0 ? "text-genius-green" : "text-red-400"}`}>{Number(p.pl) >= 0 ? "+" : ""}${Number(p.pl).toFixed(2)}</p>
                        <p className={`text-xs font-mono ${Number(p.plPct) >= 0 ? "text-genius-green/70" : "text-red-400/70"}`}>{Number(p.plPct) >= 0 ? "+" : ""}{Number(p.plPct).toFixed(2)}%</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        )}

        {tab === "orders" && (
          orders.length === 0
            ? <div className="p-12 text-center"><Activity size={32} className="text-genius-muted/30 mx-auto mb-3" /><p className="text-genius-muted text-sm">No orders yet — every trade appears here with balance.</p></div>
            : <div className="p-4 flex flex-col gap-2">
                {orders.map((o: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-genius-border hover:border-genius-green/30 transition-all">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono flex-shrink-0 ${
                      o.side === "buy" ? "bg-genius-green/20 text-genius-green border border-genius-green/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>{o.side?.toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openChart(o.symbol)} className="font-bold text-genius-green hover:underline font-mono">{o.symbol}</button>
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${o.status === "filled" ? "text-genius-green bg-genius-green/10" : "text-genius-muted bg-genius-border"}`}>{o.status}</span>
                        {o.notional && <span className="text-xs text-genius-muted font-mono">${Number(o.notional).toFixed(2)}</span>}
                      </div>
                      <p className="text-xs text-genius-muted font-mono mt-0.5">{new Date(o.time).toLocaleString()}</p>
                    </div>
                    {o.price && <span className="text-sm font-black text-white font-mono flex-shrink-0">${Number(o.price).toFixed(2)}</span>}
                  </div>
                ))}
              </div>
        )}

        {tab === "log" && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Universe",    value: `${(botLog?.universe_size || 6843).toLocaleString()} stocks` },
                { label: "Scanned",     value: `${(botLog?.stocks_scanned || 0).toLocaleString()} stocks` },
                { label: "Trades",      value: `${botLog?.trades?.length ?? 0} logged` },
              ].map(m => (
                <div key={m.label} className="bg-genius-black rounded-xl p-3 border border-genius-border text-center">
                  <p className="text-xs text-genius-muted font-mono mb-1">{m.label.toUpperCase()}</p>
                  <p className="font-black text-sm text-genius-green">{m.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-genius-muted font-mono mb-2">RECENT BOT LOG</p>
            <div className="bg-genius-black rounded-xl p-3 border border-genius-border font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {botLog?.recent_log?.length > 0
                ? botLog.recent_log.map((line: string, i: number) => (
                    <p key={i} className={line.includes("BUY") || line.includes("SELL") ? "text-genius-green" : line.includes("ERROR") ? "text-red-400" : "text-genius-muted"}>
                      {line.slice(0, 120)}
                    </p>
                  ))
                : <p className="text-genius-muted">Bot running — log populates when market opens Tuesday.</p>
              }
            </div>
          </div>
        )}
      </div>

      {/* News */}
      {news.length > 0 && (
        <div className="genius-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-genius-border">
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <Newspaper size={14} className="text-genius-green" />
              <h2 className="font-bold text-white text-sm">Market News</h2>
            </div>
            <Link href="/dashboard/news" className="text-xs text-genius-green hover:underline font-mono">View all →</Link>
          </div>
          <div className="divide-y divide-genius-border/30">
            {news.map((n: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-genius-card transition-colors">
                <button onClick={() => openChart(n.sym)} className="text-xs font-black font-mono text-genius-green px-1.5 py-0.5 rounded border border-genius-green/30 bg-genius-green/10 flex-shrink-0 mt-0.5">{n.sym}</button>
                <div className="flex-1 min-w-0">
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-xs text-white hover:text-genius-green line-clamp-2 font-medium">{n.title}</a>
                  <p className="text-[10px] text-genius-muted font-mono mt-0.5">{n.publisher}</p>
                </div>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${n.sentiment === "bullish" ? "text-genius-green bg-genius-green/10" : n.sentiment === "bearish" ? "text-red-400 bg-red-500/10" : "text-genius-muted bg-genius-border"}`}>
                  {n.sentiment === "bullish" ? "▲" : n.sentiment === "bearish" ? "▼" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
