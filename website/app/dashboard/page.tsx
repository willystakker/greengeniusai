"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, TrendingUp, DollarSign, Bell, Plus,
  Activity, Zap, CheckCircle, AlertTriangle, X,
  List, ChevronRight, RefreshCw,
} from "lucide-react";
import { useLivePrices } from "@/lib/hooks/useLivePrices";
import { useLivePortfolio } from "@/lib/hooks/useLivePortfolio";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { getUser } from "@/lib/auth";

const PORTFOLIO_HISTORY = [
  { date: "Jan", value: 10000 }, { date: "Feb", value: 10420 },
  { date: "Mar", value: 10180 }, { date: "Apr", value: 11200 },
  { date: "May", value: 10950 }, { date: "Jun", value: 11800 },
  { date: "Jul", value: 12400 }, { date: "Aug", value: 12100 },
  { date: "Sep", value: 12847 },
];

// Demo positions — entry prices baked in; live prices update current value
const DEMO_POSITIONS = [
  { sym: "NVDA", name: "NVIDIA Corp",    shares: 2.4,   entry: 875.39  },
  { sym: "BTC",  name: "Bitcoin",        shares: 0.031, entry: 68240   },
  { sym: "MSFT", name: "Microsoft",      shares: 4.1,   entry: 414.67  },
  { sym: "SOL",  name: "Solana",         shares: 9.7,   entry: 178.44  },
  { sym: "AAPL", name: "Apple Inc",      shares: 7.2,   entry: 189.42  },
  { sym: "META", name: "Meta Platforms", shares: 1.8,   entry: 528.11  },
  { sym: "CASH", name: "Cash & Equiv",   shares: 1,     entry: 885.50  },
];

const RECENT_TRADES = [
  { action: "BUY",  sym: "NVDA", amount: 2100.94, time: "2m ago",  confidence: 94, reason: "Earnings beat consensus by 18%. GPU demand from AI sector accelerating. RSI momentum continuation. Options flow 87% bullish." },
  { action: "SELL", sym: "TSLA", amount: 1100.00, time: "14m ago", confidence: 81, reason: "Delivery miss signals demand softening. Margin compression trend. Moving avg crossover bearish. Exiting before further downside." },
  { action: "BUY",  sym: "BTC",  amount:  850.00, time: "31m ago", confidence: 88, reason: "Halving cycle historically produces 6-18 month bull run. Institutional inflows at 3-month high. On-chain accumulation signal triggered." },
  { action: "BUY",  sym: "SOL",  amount:  620.00, time: "1h ago",  confidence: 79, reason: "Network activity up 44% MoM. Developer activity surging. Breakout above key resistance with volume confirmation." },
  { action: "BUY",  sym: "MSFT", amount: 1700.15, time: "3h ago",  confidence: 86, reason: "Azure cloud revenue growth accelerating. Copilot AI monetization exceeding estimates. Strong institutional accumulation detected." },
];

const PIE_COLORS = ["#00FF41","#00D97E","#7FFF00","#00BCD4","#FFD700","#FF6B6B","#4A7A4A"];

const AI_INSIGHTS = [
  { type: "opportunity", icon: TrendingUp,   text: "SMCI showing strong breakout pattern. Momentum indicators suggest 15-20% upside in next 5 days.", action: "Review Trade" },
  { type: "warning",     icon: AlertTriangle, text: "META position approaching overbought territory. Consider partial profit-taking above $540.",       action: "Review" },
  { type: "info",        icon: Activity,      text: "Fed meeting in 3 days. AI is reducing risk exposure by 12% as a precaution. Normal after announcement.", action: "Details" },
];

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-genius-card border border-genius-border rounded-lg px-3 py-2 text-xs">
      <p className="text-genius-muted">{payload[0].payload.date}</p>
      <p className="text-genius-green font-bold font-mono">${payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function PortfolioPage() {
  const router = useRouter();
  const [activeTab,     setActiveTab]     = useState<"positions"|"trades"|"insights">("positions");
  const [selectedTrade, setSelectedTrade] = useState<(typeof RECENT_TRADES)[0] | null>(null);
  const [userName,      setUserName]      = useState("Investor");
  const [notifications, setNotifications] = useState(3);

  const { prices, loading: pricesLoading, lastUpdated, pulse } = useLivePrices(20000);
  const { portfolio } = useLivePortfolio(30000);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/auth"); return; }
    setUserName(user.name || "Investor");
  }, [router]);

  // Build live positions: use Alpaca data if connected, otherwise demo + live prices
  const positions = useMemo(() => {
    if (portfolio?.connected && portfolio.positions?.length) {
      return portfolio.positions.map(p => ({
        sym:    p.sym,
        name:   p.sym,
        shares: parseFloat(p.qty),
        value:  p.value,
        change: p.plPct,
        entry:  p.entry,
      }));
    }
    return DEMO_POSITIONS.map(p => {
      if (p.sym === "CASH") return { ...p, value: p.entry, change: 0 };
      const px = prices[p.sym];
      const livePrice = px?.priceNum ?? p.entry;
      const value     = +(p.shares * livePrice).toFixed(2);
      const change    = px?.changePct ?? 0;
      return { ...p, value, change };
    });
  }, [prices, portfolio]);

  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const todayGain  = positions.reduce((s, p) => {
    if (p.sym === "CASH") return s;
    const prevValue = p.value / (1 + p.change / 100);
    return s + (p.value - prevValue);
  }, 0);
  const allTimeGain    = totalValue - 11000;
  const allTimeGainPct = ((allTimeGain / 11000) * 100).toFixed(2);
  const portfolioValue = portfolio?.connected ? (portfolio.portfolio_value ?? totalValue) : totalValue;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Welcome back, {userName.split(" ")[0]}</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-1.5">
          {pricesLoading ? <RefreshCw size={10} className="animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full inline-block ${pulse ? "bg-genius-green" : "bg-genius-green/60"}`} />}
          {lastUpdated ? `Live · updated ${lastUpdated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}` : "Connecting to live feed…"}
        </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg border border-genius-border hover:border-genius-green transition-colors">
            <Bell size={18} className="text-genius-muted" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-genius-green text-genius-black text-xs font-black rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
          <Link href="/dashboard/add-funds" className="px-4 py-2 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
            <Plus size={14} /> Add Funds
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Portfolio", value: `$${portfolioValue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: `${allTimeGain>=0?"+":""}${allTimeGainPct}% all time`, up: allTimeGain>=0, icon: DollarSign },
          { label: "Today's Gain",    value: `${todayGain>=0?"+":"-"}$${Math.abs(todayGain).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: `${todayGain>=0?"+":""}${((todayGain/totalValue)*100).toFixed(2)}% today`, up: todayGain>=0, icon: TrendingUp },
          { label: "Open Positions",  value: String(positions.filter(p=>p.sym!=="CASH").length), sub: "across 2 asset classes", up: null, icon: List },
          { label: "AI Trades (30d)", value: "47",        sub: "78.4% win rate",          up: true,  icon: Zap },
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
            <div className="flex gap-1">
              {["1W","1M","3M","1Y","ALL"].map(t => (
                <button key={t} className={`px-2 py-1 rounded text-xs font-mono transition-colors ${t==="ALL"?"bg-genius-green/20 text-genius-green":"text-genius-muted hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PORTFOLIO_HISTORY}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00FF41" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#4A7A4A",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#00FF41" strokeWidth={2} fill="url(#greenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Allocation</h2>
          <RPieChart width={180} height={150}>
            <Pie data={positions.filter(p=>p.sym!=="CASH").map(p=>({...p,weight:+((p.value/totalValue)*100).toFixed(1)}))} cx={90} cy={70} innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="weight">
              {positions.filter(p=>p.sym!=="CASH").map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
            </Pie>
          </RPieChart>
          <div className="flex flex-col gap-1.5 mt-2">
            {positions.slice(0,5).map((p,i) => (
              <div key={p.sym} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:PIE_COLORS[i]}} />
                  <span className="text-genius-muted font-mono">{p.sym}</span>
                </div>
                <span className="text-white font-mono">{+((p.value/totalValue)*100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Intelligence Feed */}
      <div className="genius-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-genius-green" />
          <h2 className="font-bold text-white text-sm">AI Intelligence Feed</h2>
          <div className="live-dot ml-auto" />
          <span className="text-xs text-genius-green font-mono">LIVE</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {AI_INSIGHTS.map((ins, i) => (
            <div key={i} className={`rounded-lg p-3 border text-xs ${
              ins.type==="opportunity" ? "border-genius-green/30 bg-genius-green/5" :
              ins.type==="warning"     ? "border-yellow-500/30 bg-yellow-500/5"     :
                                         "border-genius-border bg-genius-card"
            }`}>
              <div className="flex items-start gap-2 mb-2">
                <ins.icon size={13} className={ins.type==="opportunity"?"text-genius-green":ins.type==="warning"?"text-yellow-400":"text-genius-muted"} />
                <p className="text-genius-text leading-relaxed">{ins.text}</p>
              </div>
              <button className="text-genius-green font-bold hover:underline">{ins.action} →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex border-b border-genius-border">
          {(["positions","trades","insights"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab===tab
                  ? "text-genius-green border-b-2 border-genius-green bg-genius-green/5"
                  : "text-genius-muted hover:text-white"
              }`}
            >
              {tab==="positions"?"Open Positions":tab==="trades"?"Recent AI Trades":"AI Analysis"}
            </button>
          ))}
        </div>

        {activeTab==="positions" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genius-border">
                {["Asset","Shares","Value","Today","Weight","Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const weight = +((p.value / totalValue) * 100).toFixed(1);
                return (
                  <tr key={p.sym} className="border-b border-genius-border/50 hover:bg-genius-card transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white font-mono">{p.sym}</p>
                      <p className="text-xs text-genius-muted">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-genius-text">{p.shares}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      ${p.value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${p.change>0?"bg-genius-green/10 text-genius-green":p.change<0?"bg-red-500/10 text-red-400":"bg-genius-border text-genius-muted"}`}>
                        {p.change>0?"+":""}{p.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-genius-border rounded-full overflow-hidden">
                          <div className="h-full bg-genius-green rounded-full" style={{width:`${Math.min(weight*3,100)}%`}} />
                        </div>
                        <span className="text-xs font-mono text-genius-muted">{weight}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.sym!=="CASH" && (
                        <div className="flex gap-2">
                          <button className="px-2 py-1 rounded bg-genius-green/10 text-genius-green text-xs font-bold border border-genius-green/20 hover:bg-genius-green/20">+</button>
                          <button className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20">−</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab==="trades" && (
          <div className="p-4 flex flex-col gap-3">
            {RECENT_TRADES.map((t,i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-genius-border hover:border-genius-green/30 cursor-pointer transition-all"
                onClick={() => setSelectedTrade(t)}>
                <div className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono flex-shrink-0 ${t.action==="BUY"?"bg-genius-green/20 text-genius-green border border-genius-green/30":"bg-red-500/20 text-red-400 border border-red-500/30"}`}>{t.action}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{t.sym}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-genius-border rounded-full overflow-hidden">
                          <div className="h-full bg-genius-green rounded-full" style={{width:`${t.confidence}%`}} />
                        </div>
                        <span className="text-xs font-mono text-genius-green">{t.confidence}%</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">${t.amount.toLocaleString()}</span>
                      <span className="text-xs text-genius-muted font-mono">{t.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-genius-text leading-relaxed line-clamp-1">{t.reason}</p>
                </div>
                <ChevronRight size={14} className="text-genius-muted flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}

        {activeTab==="insights" && (
          <div className="p-6">
            <div className="genius-card rounded-xl p-5 border border-genius-green/20 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-genius-green" />
                <h3 className="font-bold text-white">Market Outlook — Today</h3>
                <span className="ml-auto text-xs text-genius-muted font-mono">Updated 2 min ago</span>
              </div>
              <p className="text-sm text-genius-text leading-relaxed">
                Markets are showing cautious optimism ahead of the Fed's next policy statement. Tech sector momentum remains strong, particularly AI-adjacent names. Crypto markets are in a mid-cycle consolidation phase after the recent halving — accumulation signals are favorable for BTC and SOL. GreenGeniusAI has increased tech weighting to 42% and reduced consumer discretionary exposure. Cash buffer held at 7% for opportunistic buys.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Market Sentiment", value: "Bullish",  score: 72, color: "text-genius-green" },
                { label: "Volatility (VIX)", value: "Elevated", score: 58, color: "text-yellow-400"  },
                { label: "AI Confidence",    value: "High",     score: 86, color: "text-genius-green" },
              ].map((m,i) => (
                <div key={i} className="genius-card rounded-xl p-4 text-center">
                  <p className="text-xs text-genius-muted font-mono mb-2">{m.label.toUpperCase()}</p>
                  <p className={`text-2xl font-black mb-1 ${m.color}`}>{m.score}</p>
                  <p className="text-xs text-genius-text">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trade detail modal */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTrade(null)}>
          <div className="genius-card rounded-2xl p-6 max-w-md w-full border border-genius-border glow-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-lg">AI Trade Reasoning</h3>
              <button onClick={() => setSelectedTrade(null)} className="text-genius-muted hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`px-3 py-1.5 rounded-lg text-sm font-black font-mono ${selectedTrade.action==="BUY"?"bg-genius-green/20 text-genius-green border border-genius-green/30":"bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                {selectedTrade.action}
              </div>
              <div><p className="font-bold text-white">{selectedTrade.sym}</p><p className="text-xs text-genius-muted">{selectedTrade.time}</p></div>
              <div className="ml-auto text-right">
                <p className="font-black text-white font-mono">${selectedTrade.amount.toLocaleString()}</p>
                <p className="text-xs text-genius-green font-mono">{selectedTrade.confidence}% confidence</p>
              </div>
            </div>
            <div className="bg-genius-black rounded-xl p-4 border border-genius-border mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-genius-green" />
                <span className="text-xs font-mono font-bold text-genius-green">AI REASONING</span>
              </div>
              <p className="text-sm text-genius-text leading-relaxed">{selectedTrade.reason}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-genius-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-genius-green to-genius-emerald rounded-full" style={{width:`${selectedTrade.confidence}%`}} />
              </div>
              <span className="text-xs font-mono text-genius-green font-bold">{selectedTrade.confidence}% confidence</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
