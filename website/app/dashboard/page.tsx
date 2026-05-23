"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, TrendingUp, DollarSign, Bell, Plus,
  Activity, Zap, AlertTriangle, X,
  List, ChevronRight, RefreshCw, Newspaper, ExternalLink,
  Bot, CheckCircle, BarChart3, Wifi, Target,
} from "lucide-react";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import { useLivePortfolio } from "@/lib/hooks/useLivePortfolio";
import { useTickerChart } from "@/components/TickerChartProvider";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { getUser } from "@/lib/auth";

const PIE_COLORS = ["#00FF41","#00D97E","#7FFF00","#00BCD4","#FFD700","#FF6B6B","#4A7A4A"];
const GOAL = 175;

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="text-genius-muted">{payload[0].payload.label}</p>
      <p className="text-genius-green font-bold font-mono">${payload[0].value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
    </div>
  );
}

type BotTrade = {
  time: string; side: "BUY"|"SELL"; symbol: string;
  amount?: number; reason?: string; balance?: number;
};

export default function PortfolioPage() {
  const router = useRouter();
  const [activeTab,     setActiveTab]     = useState<"positions"|"trades"|"activity">("positions");
  const [userName,      setUserName]      = useState("Investor");
  const [notifications, setNotifications] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [botActivity,   setBotActivity]   = useState<{
    trades: BotTrade[]; last_balance: number|null;
    universe_size: number; stocks_scanned: number; batches_run: number;
    recent_log: string[];
  } | null>(null);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const [hasKeys, setHasKeys] = useState(false);

  const { prices, loading: pricesLoading, lastUpdated, pulse } = useLivePrices(20000);
  const { portfolio, loading: portfolioLoading } = useLivePortfolio(15000);
  const { open: openChart } = useTickerChart();

  useEffect(() => {
    setHasKeys(!!localStorage.getItem("ggai_alpaca_key"));
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/auth"); return; }
    setUserName(user.name || "Investor");
  }, [router]);

  // Poll bot activity log every 30s
  const fetchBotActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/activity");
      if (res.ok) {
        const data = await res.json();
        setBotActivity(data);
        if (data.trades?.length > 0) {
          setNotifications(data.trades.filter((t: BotTrade) => {
            const tradeTime = new Date(t.time).getTime();
            return Date.now() - tradeTime < 3600000; // trades in last hour
          }).length);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBotActivity();
    const iv = setInterval(fetchBotActivity, 30000);
    return () => clearInterval(iv);
  }, [fetchBotActivity]);

  // News for held symbols
  const fetchNews = useCallback(async () => {
    const syms = portfolio?.positions?.length
      ? portfolio.positions.slice(0, 4).map(p => p.sym)
      : ["NVDA", "AAPL", "MSFT", "TSLA"];
    try {
      const all = await Promise.all(syms.map(async sym => {
        try {
          const r = await fetch(`/api/news?sym=${sym}`);
          const d = await r.json();
          return (d.news ?? []).slice(0, 2).map((n: any) => ({ ...n, sym }));
        } catch { return []; }
      }));
      const flat = all.flat().sort((a: any, b: any) => b.publishedAt - a.publishedAt);
      const seen = new Set<string>();
      setNewsItems(flat.filter((n: any) => { if (seen.has(n.title)) return false; seen.add(n.title); return true; }).slice(0, 6));
    } catch {}
  }, [portfolio?.positions]);

  useEffect(() => {
    fetchNews();
    const iv = setInterval(fetchNews, 60000);
    return () => clearInterval(iv);
  }, [fetchNews]);

  const connected  = portfolio?.connected ?? false;
  const equity     = portfolio?.portfolio_value ?? 100;
  const cash       = portfolio?.cash ?? 100;
  const positions  = portfolio?.positions ?? [];
  const orders     = portfolio?.recent_orders ?? [];
  const goalPct    = Math.min((equity / GOAL) * 100, 100);
  const startValue = 100;
  const totalGain  = equity - startValue;
  const totalGainPct = ((totalGain / startValue) * 100).toFixed(2);

  // Today's gain from positions
  const todayGain = positions.reduce((s, p) => {
    const prev = p.current / (1 + p.plPct / 100);
    return s + (p.current - prev) * p.qty;
  }, 0);

  // Build chart: start at $100, add trades as waypoints, end at current equity
  const chartData = useMemo(() => {
    const trades = botActivity?.trades ?? [];
    if (trades.length === 0) {
      return [{ label: "Start", value: 100 }, { label: "Now", value: equity }];
    }
    const points = [{ label: "Start", value: 100 }];
    [...trades].reverse().forEach(t => {
      if (t.balance) points.push({ label: t.time.slice(5, 16), value: t.balance });
    });
    points.push({ label: "Now", value: equity });
    return points;
  }, [botActivity?.trades, equity]);

  const noConnection = !portfolioLoading && !connected;

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Welcome back, {userName.split(" ")[0]}</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-1.5">
            {portfolioLoading
              ? <RefreshCw size={10} className="animate-spin" />
              : <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? (pulse ? "bg-genius-green" : "bg-genius-green/60") : "bg-red-500"}`} />}
            {connected
              ? `Live · updated ${lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "..."}`
              : portfolioLoading ? "Connecting to Alpaca..." : "Not connected — add keys in Settings"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notifications > 0 && (
            <button onClick={() => setNotifications(0)} className="relative p-2 rounded-lg border border-genius-border hover:border-genius-green transition-colors">
              <Bell size={18} className="text-genius-muted" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-genius-green text-genius-black text-xs font-black rounded-full flex items-center justify-center">{notifications}</span>
            </button>
          )}
          <button onClick={fetchBotActivity} className="px-4 py-2 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link href="/dashboard/add-funds" className="px-4 py-2 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
            <Plus size={14} /> Add Funds
          </Link>
        </div>
      </div>

      {/* No keys — prompt to connect */}
      {noConnection && !hasKeys && (
        <div className="genius-card rounded-xl p-6 border border-yellow-500/30 bg-yellow-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Connect your Alpaca account to see live data</p>
              <p className="text-xs text-genius-muted mt-0.5">Add your API keys in Settings → Account to display your real $100 balance and bot trades.</p>
            </div>
          </div>
          <Link href="/dashboard/settings?section=account" className="px-4 py-2 rounded-lg btn-genius text-sm font-bold flex-shrink-0 flex items-center gap-2">
            <Wifi size={13} /> Connect Now
          </Link>
        </div>
      )}

      {/* Goal progress bar */}
      {connected && (
        <div className="genius-card rounded-xl p-4 border border-genius-green/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-genius-green" />
              <span className="text-sm font-bold text-white">Goal: $100 → $175</span>
            </div>
            <span className="text-sm font-black text-genius-green font-mono">${equity.toFixed(2)} / $175</span>
          </div>
          <div className="w-full h-2.5 bg-genius-border rounded-full overflow-hidden">
            <div
              className="h-full bg-genius-green rounded-full transition-all duration-700"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-genius-muted font-mono">$100 start</span>
            <span className="text-xs text-genius-green font-mono font-bold">{goalPct.toFixed(1)}% there</span>
            <span className="text-xs text-genius-muted font-mono">$175 goal</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Portfolio",
            value: `$${equity.toLocaleString("en-US",{minimumFractionDigits:2})}`,
            sub: connected ? `${totalGain>=0?"+":""}${totalGainPct}% from $100 start` : "Connect Alpaca to see live balance",
            up: totalGain>=0, icon: DollarSign,
          },
          {
            label: "Today's Gain",
            value: `${todayGain>=0?"+":"-"}$${Math.abs(todayGain).toLocaleString("en-US",{minimumFractionDigits:2})}`,
            sub: equity > 0 ? `${todayGain>=0?"+":""}${((todayGain/equity)*100).toFixed(2)}% today` : "—",
            up: todayGain>=0, icon: TrendingUp,
          },
          {
            label: "Open Positions",
            value: String(positions.length),
            sub: `$${cash.toLocaleString("en-US",{minimumFractionDigits:2})} cash available`,
            up: null, icon: List,
          },
          {
            label: "Bot Activity",
            value: botActivity ? `${botActivity.stocks_scanned.toLocaleString()}` : "—",
            sub: botActivity ? `stocks scanned · ${botActivity.trades.length} trades` : "Waiting for market open",
            up: null, icon: Bot,
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
            <p className={`text-xs font-mono ${k.up === true ? "text-genius-green" : k.up === false ? "text-red-400" : "text-genius-muted"}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Pie */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 genius-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Portfolio Growth</h2>
            <span className="text-xs text-genius-muted font-mono">Live Alpaca account</span>
          </div>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00FF41" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v.toFixed(0)}`} domain={[90, Math.max(180, equity+10)]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#00FF41" strokeWidth={2} fill="url(#greenGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <BarChart3 size={36} className="text-genius-muted/30 mb-3" />
              <p className="text-sm text-genius-muted">Chart builds as the bot trades</p>
              <p className="text-xs text-genius-muted mt-1">First scan runs Tuesday 9:30 AM ET</p>
            </div>
          )}
        </div>

        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Allocation</h2>
          {positions.length > 0 ? (
            <>
              <RPieChart width={180} height={150}>
                <Pie
                  data={positions.map(p => ({ name: p.sym, weight: +((p.value / equity) * 100).toFixed(1) }))}
                  cx={90} cy={70} innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="weight"
                >
                  {positions.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </RPieChart>
              <div className="flex flex-col gap-1.5 mt-2">
                {positions.slice(0, 5).map((p, i) => (
                  <div key={p.sym} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <button onClick={() => openChart(p.sym)} className="text-genius-muted font-mono hover:text-genius-green transition-colors">{p.sym}</button>
                    </div>
                    <span className="text-white font-mono">{equity > 0 ? +((p.value / equity) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <Bot size={28} className="text-genius-muted/30 mb-3" />
              <p className="text-sm text-genius-muted text-center">Bot is scanning<br />6,843 stocks</p>
              <p className="text-xs text-genius-muted mt-1 font-mono">Positions appear after first trade</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex border-b border-genius-border">
          {(["positions","trades","activity"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab===tab
                  ? "text-genius-green border-b-2 border-genius-green bg-genius-green/5"
                  : "text-genius-muted hover:text-white"
              }`}
            >
              {tab==="positions" ? `Open Positions (${positions.length})`
               : tab==="trades"    ? `Bot Trades (${botActivity?.trades.length ?? 0})`
               :                     "Bot Activity Log"}
            </button>
          ))}
        </div>

        {/* Positions */}
        {activeTab==="positions" && (
          positions.length === 0 ? (
            <div className="p-12 text-center">
              <Bot size={32} className="text-genius-muted/30 mx-auto mb-3" />
              <p className="text-genius-muted text-sm">No open positions yet.</p>
              <p className="text-xs text-genius-muted mt-1">Bot opens first trade when market opens Tuesday.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-genius-border">
                  {["Asset","Qty","Avg Entry","Current","Value","P&L"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.sym} className="border-b border-genius-border/50 hover:bg-genius-card transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openChart(p.sym)} className="font-bold font-mono text-genius-green hover:underline">{p.sym}</button>
                    </td>
                    <td className="px-4 py-3 font-mono text-genius-text">{p.qty.toFixed(4)}</td>
                    <td className="px-4 py-3 font-mono text-genius-text">${p.entry.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-white">${p.current.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">${p.value.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <p className={`font-mono font-bold text-sm ${p.pl>=0?"text-genius-green":"text-red-400"}`}>
                        {p.pl>=0?"+":""}${p.pl.toFixed(2)}
                      </p>
                      <p className={`text-xs font-mono ${p.plPct>=0?"text-genius-green/70":"text-red-400/70"}`}>
                        {p.plPct>=0?"+":""}{p.plPct.toFixed(2)}%
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* Bot Trades */}
        {activeTab==="trades" && (
          !botActivity || botActivity.trades.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={32} className="text-genius-muted/30 mx-auto mb-3" />
              <p className="text-genius-muted text-sm">No trades logged yet.</p>
              <p className="text-xs text-genius-muted mt-1">Every buy and sell will appear here with your running balance.</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {botActivity.trades.map((t, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-genius-border hover:border-genius-green/30 transition-all">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono flex-shrink-0 ${
                    t.side==="BUY" ? "bg-genius-green/20 text-genius-green border border-genius-green/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}>{t.side}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openChart(t.symbol)} className="font-bold text-genius-green hover:underline font-mono text-sm">{t.symbol}</button>
                      {t.amount && <span className="text-xs text-genius-muted font-mono">${t.amount.toFixed(2)}</span>}
                      {t.reason && <span className="text-xs text-genius-muted truncate">{t.reason}</span>}
                    </div>
                    <p className="text-xs text-genius-muted font-mono mt-0.5">{t.time}</p>
                  </div>
                  {t.balance && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-white font-mono">${t.balance.toFixed(2)}</p>
                      <p className="text-xs text-genius-muted font-mono">balance</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Activity Log */}
        {activeTab==="activity" && (
          <div className="p-4">
            {botActivity ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Universe",      value: `${botActivity.universe_size.toLocaleString()} stocks` },
                    { label: "Scanned",       value: `${botActivity.stocks_scanned.toLocaleString()} stocks` },
                    { label: "Scan Batches",  value: `${botActivity.batches_run} runs` },
                  ].map(m => (
                    <div key={m.label} className="bg-genius-black rounded-xl p-3 border border-genius-border text-center">
                      <p className="text-xs text-genius-muted font-mono mb-1">{m.label.toUpperCase()}</p>
                      <p className="font-black text-sm text-genius-green">{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-genius-muted font-mono mb-2">RECENT LOG</p>
                <div className="bg-genius-black rounded-xl p-3 border border-genius-border font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                  {botActivity.recent_log.length > 0 ? botActivity.recent_log.map((line, i) => (
                    <p key={i} className={`${line.includes("BUY") || line.includes("SELL") ? "text-genius-green" : line.includes("ERROR") ? "text-red-400" : "text-genius-muted"}`}>
                      {line.slice(0, 100)}
                    </p>
                  )) : (
                    <p className="text-genius-muted">Bot is running — log will populate when market opens.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <RefreshCw size={28} className="text-genius-muted/30 mx-auto mb-3 animate-spin" />
                <p className="text-genius-muted text-sm">Loading bot activity...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* News */}
      {newsItems.length > 0 && (
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
            {newsItems.map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-genius-card transition-colors">
                <button onClick={() => openChart(n.sym)} className="text-xs font-black font-mono text-genius-green hover:underline px-1.5 py-0.5 rounded border border-genius-green/30 bg-genius-green/10 flex-shrink-0 mt-0.5">
                  {n.sym}
                </button>
                <div className="flex-1 min-w-0">
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-xs text-white hover:text-genius-green transition-colors leading-snug line-clamp-2 font-medium">
                    {n.title}
                  </a>
                  <p className="text-[10px] text-genius-muted font-mono mt-0.5">{n.publisher}</p>
                </div>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                  n.sentiment==="bullish" ? "text-genius-green bg-genius-green/10" :
                  n.sentiment==="bearish" ? "text-red-400 bg-red-500/10" : "text-genius-muted bg-genius-border"
                }`}>
                  {n.sentiment==="bullish" ? "▲" : n.sentiment==="bearish" ? "▼" : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
