"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, Plus, X, CheckCircle, AlertTriangle, TrendingUp,
  TrendingDown, Brain, Trash2, ToggleLeft, ToggleRight, Clock,
  Newspaper, Lock, Star, Zap, Volume2, BarChart2, Calendar,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertType =
  | "price-above" | "price-below"
  | "news-bullish" | "news-bearish"
  | "rsi-overbought" | "rsi-oversold"
  | "earnings-upcoming"
  | "pnl-gain" | "pnl-loss"
  | "ai-signal"
  | "volume-spike";

type AlertTab = "All" | "Price" | "News" | "Technical" | "Earnings";

type AlertItem = {
  id: number;
  type: AlertType;
  sym: string;
  value: string;
  label: string;
  active: boolean;
  triggered: boolean;
  ago?: string;
};

// ─── Icon + color helpers ─────────────────────────────────────────────────────
function getAlertMeta(type: AlertType): { icon: React.ElementType; color: string } {
  switch (type) {
    case "price-above":      return { icon: TrendingUp,    color: "text-genius-green" };
    case "price-below":      return { icon: TrendingDown,  color: "text-red-400" };
    case "news-bullish":     return { icon: Newspaper,     color: "text-genius-green" };
    case "news-bearish":     return { icon: Newspaper,     color: "text-red-400" };
    case "rsi-overbought":   return { icon: BarChart2,     color: "text-yellow-400" };
    case "rsi-oversold":     return { icon: BarChart2,     color: "text-genius-emerald" };
    case "earnings-upcoming":return { icon: Calendar,      color: "text-yellow-400" };
    case "pnl-gain":         return { icon: CheckCircle,   color: "text-genius-emerald" };
    case "pnl-loss":         return { icon: AlertTriangle, color: "text-yellow-400" };
    case "ai-signal":        return { icon: Brain,         color: "text-genius-green" };
    case "volume-spike":     return { icon: Volume2,       color: "text-genius-green" };
    default:                 return { icon: Bell,          color: "text-genius-muted" };
  }
}

function getTabForType(type: AlertType): AlertTab {
  if (type === "price-above" || type === "price-below") return "Price";
  if (type === "news-bullish" || type === "news-bearish") return "News";
  if (type === "rsi-overbought" || type === "rsi-oversold" || type === "volume-spike") return "Technical";
  if (type === "earnings-upcoming") return "Earnings";
  return "All";
}

// ─── Static data ──────────────────────────────────────────────────────────────
const INITIAL_ALERTS: AlertItem[] = [
  { id: 1,  type: "price-above",       sym: "BTC",  value: "$85,000",  label: "BTC price rises above $85,000",         active: true,  triggered: false },
  { id: 2,  type: "price-below",       sym: "NVDA", value: "$820",     label: "NVDA price falls below $820",            active: true,  triggered: false },
  { id: 3,  type: "pnl-loss",          sym: "ALL",  value: "−$500",    label: "Daily P&L hits −$500",                   active: true,  triggered: false },
  { id: 4,  type: "ai-signal",         sym: "SOL",  value: "BUY 90%+", label: "AI BUY signal on SOL ≥ 90%",            active: true,  triggered: false },
  { id: 5,  type: "price-above",       sym: "ETH",  value: "$3,500",   label: "ETH price rises above $3,500",           active: false, triggered: false },
  { id: 6,  type: "pnl-gain",          sym: "ALL",  value: "+$1,000",  label: "Portfolio gains exceed +$1,000",         active: true,  triggered: false },
  { id: 7,  type: "news-bullish",      sym: "AAPL", value: "Bullish",  label: "AI detects bullish news on AAPL",        active: true,  triggered: false },
  { id: 8,  type: "news-bearish",      sym: "TSLA", value: "Bearish",  label: "AI detects bearish news on TSLA",        active: true,  triggered: false },
  { id: 9,  type: "rsi-overbought",    sym: "NVDA", value: "RSI > 70", label: "NVDA RSI crosses above 70 (overbought)", active: true,  triggered: false },
  { id: 10, type: "rsi-oversold",      sym: "META", value: "RSI < 30", label: "META RSI drops below 30 (oversold)",     active: false, triggered: false },
  { id: 11, type: "earnings-upcoming", sym: "MSFT", value: "3 days",   label: "MSFT earnings in 3 days",                active: true,  triggered: false },
  { id: 12, type: "volume-spike",      sym: "AMD",  value: "2× avg",   label: "AMD volume spike — 2× above average",    active: true,  triggered: false },
];

const HISTORY = [
  { sym: "NVDA", label: "NVDA crossed $900 — price alert triggered",  time: "2h ago",    type: "price-above" as AlertType, outcome: "Price continued to $947" },
  { sym: "BTC",  label: "BTC dropped below $74,000 — alert fired",    time: "Yesterday", type: "price-below" as AlertType, outcome: "Bounced +6% within 4h" },
  { sym: "ALL",  label: "Daily P&L exceeded +$800 — AI notified",     time: "2d ago",    type: "pnl-gain" as AlertType,    outcome: "Bot locked in gains" },
  { sym: "SOL",  label: "AI Strong Buy signal on SOL fired 92%",       time: "3d ago",    type: "ai-signal" as AlertType,   outcome: "Position entered, +8.3%" },
];

const SMART_PREVIEW_ALERTS = [
  { sym: "NVDA", headline: "NVDA: Jensen Huang confirms next-gen Blackwell Ultra chip ahead of schedule", sentiment: "bullish", time: "4m ago" },
  { sym: "AAPL", headline: "AAPL: Apple Vision Pro 2 leaks — mass production confirmed for Q3",           sentiment: "bullish", time: "12m ago" },
  { sym: "TSLA", headline: "TSLA: DOJ opens investigation into Autopilot safety claims",                  sentiment: "bearish", time: "31m ago" },
];

const SYMBOLS = [
  "BTC","ETH","SOL","AAPL","NVDA","MSFT","META","AMD","TSLA","AMZN","GOOGL","SMCI","NFLX","ALL",
];

const TYPES: { value: AlertType; label: string }[] = [
  { value: "price-above",       label: "Price rises above" },
  { value: "price-below",       label: "Price falls below" },
  { value: "news-bullish",      label: "AI detects bullish news" },
  { value: "news-bearish",      label: "AI detects bearish news" },
  { value: "rsi-overbought",    label: "RSI overbought (> 70)" },
  { value: "rsi-oversold",      label: "RSI oversold (< 30)" },
  { value: "earnings-upcoming", label: "Earnings upcoming (3 days)" },
  { value: "pnl-gain",          label: "Portfolio P&L exceeds (gain)" },
  { value: "pnl-loss",          label: "Portfolio P&L hits (loss)" },
  { value: "ai-signal",         label: "AI signal fires" },
  { value: "volume-spike",      label: "Volume spike (2× average)" },
];

const TABS: AlertTab[] = ["All", "Price", "News", "Technical", "Earnings"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const { open: openChart } = useTickerChart();
  const [alerts, setAlerts]             = useState<AlertItem[]>(INITIAL_ALERTS);
  const [showNew, setShowNew]           = useState(false);
  const [activeTab, setActiveTab]       = useState<AlertTab>("All");
  const [smartAlertsActive, setSmartAlertsActive] = useState(false);
  const [channels, setChannels]         = useState([
    { key: "inapp", channel: "In-App",     desc: "Dashboard bell notifications", enabled: true },
    { key: "email", channel: "Email",      desc: "jaden@greengeniusai.com",       enabled: true },
    { key: "sms",   channel: "SMS / Text", desc: "(480) 798-0753",                enabled: false },
    { key: "push",  channel: "Push (iOS)", desc: "Mobile app required",           enabled: false },
  ]);
  const [form, setForm] = useState<{ sym: string; type: AlertType; threshold: string }>({
    sym: "BTC", type: "price-above", threshold: "",
  });

  const toggleAlert  = (id: number) => setAlerts(a => a.map(x => x.id === id ? { ...x, active: !x.active } : x));
  const deleteAlert  = (id: number) => setAlerts(a => a.filter(x => x.id !== id));
  const toggleChannel = (key: string) =>
    setChannels(c => c.map(x => x.key === key ? { ...x, enabled: !x.enabled } : x));

  const addAlert = () => {
    if (!form.threshold) return;
    const typeMeta = getAlertMeta(form.type);
    const typeLabel = TYPES.find(t => t.value === form.type)?.label ?? form.type;
    const newAlert: AlertItem = {
      id:        Date.now(),
      type:      form.type,
      sym:       form.sym,
      value:     form.threshold,
      label:     `${typeLabel} — ${form.sym} ${form.threshold}`,
      active:    true,
      triggered: false,
    };
    setAlerts(a => [newAlert, ...a]);
    setForm({ sym: "BTC", type: "price-above", threshold: "" });
    setShowNew(false);
  };

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === "All") return true;
    const tab = getTabForType(a.type);
    return (activeTab as string) === (tab as string);
  });

  const activeCount     = alerts.filter(a => a.active).length;
  const triggeredToday  = 4;
  const newsAlertCount  = alerts.filter(a => a.type === "news-bullish" || a.type === "news-bearish").length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Alerts</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">
            {activeCount} active · {triggeredToday} triggered today
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold"
        >
          <Plus size={14} /> New Alert
        </button>
      </div>

      {/* ── Smart Alerts Upsell Banner ── */}
      <div className={`rounded-2xl border p-5 relative overflow-hidden ${
        smartAlertsActive
          ? "border-genius-green/50 bg-genius-green/8"
          : "border-genius-green/30 bg-genius-green/5"
      }`}>
        {smartAlertsActive && (
          <span className="absolute top-4 right-4 bg-genius-green text-genius-black text-xs font-black px-2.5 py-1 rounded-full tracking-widest">
            ACTIVE
          </span>
        )}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-genius-green/20 flex items-center justify-center">
                <Zap size={16} className="text-genius-green" />
              </div>
              <h2 className="font-black text-white text-base">Smart Alerts — 24/7 AI News &amp; Technical Scanning</h2>
            </div>
            <p className="text-sm text-genius-muted mb-4 leading-relaxed">
              Your AI monitors breaking news, RSI signals, earnings, and dark pool flow.
              Get notified the instant anything moves your portfolio.
            </p>
            <div className="flex flex-wrap gap-2">
              {["News alerts", "RSI overbought/oversold", "Earnings upcoming", "Volume anomaly", "Dark pool flow"].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-genius-green/10 text-genius-green border border-genius-green/20">
                  <CheckCircle size={10} /> {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
            <p className="text-2xl font-black text-genius-green">$3<span className="text-sm text-genius-muted font-normal">/month add-on</span></p>
            {smartAlertsActive ? (
              <button
                onClick={() => setSmartAlertsActive(false)}
                className="px-5 py-2.5 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors"
              >
                Manage Smart Alerts
              </button>
            ) : (
              <Link
                href="/dashboard/billing?addon=smart-alerts"
                onClick={() => setSmartAlertsActive(true)}
                className="px-5 py-2.5 rounded-lg btn-genius text-sm font-bold whitespace-nowrap"
              >
                Activate Smart Alerts — $3/mo
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Alerts",    value: activeCount,                                               color: "text-genius-green",   icon: Bell },
          { label: "Triggered Today",  value: triggeredToday,                                            color: "text-yellow-400",     icon: AlertTriangle },
          { label: "AI News Alerts",   value: newsAlertCount,                                            color: "text-genius-emerald", icon: Newspaper },
          { label: "Smart Alerts",     value: smartAlertsActive ? "ON" : "OFF",                          color: smartAlertsActive ? "text-genius-green" : "text-genius-muted", icon: Zap },
        ].map((k, i) => (
          <div key={i} className="genius-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className="w-8 h-8 rounded-lg bg-genius-green/10 flex items-center justify-center">
                <k.icon size={14} className="text-genius-green" />
              </div>
            </div>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-5 gap-6">
        {/* Alert List */}
        <div className="col-span-3 genius-card rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-genius-border overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "text-genius-green border-b-2 border-genius-green bg-genius-green/5"
                    : "text-genius-muted hover:text-white"
                }`}
              >
                {tab.toUpperCase()}
                {tab === "All" && (
                  <span className="ml-1.5 text-genius-black bg-genius-green rounded-full px-1.5 py-0.5 text-xs font-black">
                    {alerts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Alert Rows */}
          <div className="flex flex-col divide-y divide-genius-border/40">
            {filteredAlerts.length === 0 && (
              <div className="px-5 py-10 text-center text-genius-muted text-sm font-mono">
                No alerts in this category
              </div>
            )}
            {filteredAlerts.map(a => {
              const meta = getAlertMeta(a.type);
              const Icon = meta.icon;
              return (
                <div
                  key={a.id}
                  className={`px-5 py-4 hover:bg-genius-card transition-colors ${!a.active ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        a.active ? "bg-genius-green/10" : "bg-genius-border"
                      }`}>
                        <Icon size={14} className={a.active ? meta.color : "text-genius-muted"} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{a.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            onClick={() => a.sym !== "ALL" && openChart(a.sym)}
                            className="text-xs font-mono bg-genius-border text-genius-muted px-1.5 py-0.5 rounded hover:text-white transition-colors"
                          >
                            {a.sym}
                          </button>
                          <span className="text-xs text-genius-muted font-mono">{a.type.replace(/-/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAlert(a.id)}
                        className={`transition-colors ${a.active ? "text-genius-green" : "text-genius-muted"}`}
                      >
                        {a.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => deleteAlert(a.id)}
                        className="text-genius-muted hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Alert History */}
          <div className="genius-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-genius-border">
              <h2 className="font-bold text-white text-sm">Trigger History</h2>
            </div>
            <div className="flex flex-col divide-y divide-genius-border/40">
              {HISTORY.map((h, i) => {
                const meta = getAlertMeta(h.type);
                const Icon = meta.icon;
                return (
                  <div key={i} className="px-4 py-3 hover:bg-genius-card transition-colors">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Icon size={12} className={meta.color} />
                        <p className="text-xs text-genius-text leading-snug truncate">{h.label}</p>
                      </div>
                      <span className="text-xs text-genius-muted font-mono flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} /> {h.time}
                      </span>
                    </div>
                    <p className="text-xs text-genius-muted pl-4">→ {h.outcome}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification Channels */}
          <div className="genius-card rounded-xl p-4">
            <h2 className="font-bold text-white text-sm mb-3">Notification Channels</h2>
            <div className="flex flex-col gap-3">
              {channels.map(c => (
                <div key={c.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.channel}</p>
                    <p className="text-xs text-genius-muted">{c.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleChannel(c.key)}
                    className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                      c.enabled ? "bg-genius-green" : "bg-genius-border"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      c.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Alerts Preview (locked when inactive) */}
          <div className="genius-card rounded-xl overflow-hidden border border-genius-green/20">
            <div className="p-4 border-b border-genius-border flex items-center justify-between">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Newspaper size={14} className="text-genius-green" />
                Live AI News Alerts
              </h2>
              {!smartAlertsActive && (
                <span className="text-xs font-mono text-genius-muted flex items-center gap-1">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>
            <div className="relative">
              <div className={`flex flex-col divide-y divide-genius-border/40 ${!smartAlertsActive ? "blur-sm pointer-events-none select-none" : ""}`}>
                {SMART_PREVIEW_ALERTS.map((n, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-mono bg-genius-border text-genius-muted px-1.5 py-0.5 rounded">{n.sym}</span>
                      <span className={`text-xs font-mono font-bold ${n.sentiment === "bullish" ? "text-genius-green" : "text-red-400"}`}>
                        {n.sentiment.toUpperCase()}
                      </span>
                      <span className="text-xs text-genius-muted ml-auto">{n.time}</span>
                    </div>
                    <p className="text-xs text-genius-text leading-snug">{n.headline}</p>
                  </div>
                ))}
              </div>
              {!smartAlertsActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-genius-dark/40">
                  <div className="w-10 h-10 rounded-full bg-genius-border flex items-center justify-center">
                    <Lock size={18} className="text-genius-muted" />
                  </div>
                  <p className="text-xs text-genius-muted font-mono text-center px-4">
                    Activate Smart Alerts to<br />unlock live AI news scanning
                  </p>
                  <Link
                    href="/dashboard/billing?addon=smart-alerts"
                    className="px-4 py-2 rounded-lg btn-genius text-xs font-bold"
                  >
                    Unlock — $3/mo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Alert Modal ── */}
      {showNew && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowNew(false)}
        >
          <div
            className="genius-card rounded-2xl p-6 max-w-md w-full border border-genius-border glow-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Bell size={18} className="text-genius-green" /> Create Alert
              </h3>
              <button onClick={() => setShowNew(false)} className="text-genius-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-genius-muted font-mono mb-1.5 block">ASSET</label>
                <select
                  value={form.sym}
                  onChange={e => setForm(f => ({ ...f, sym: e.target.value }))}
                  className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-genius-green"
                >
                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-genius-muted font-mono mb-1.5 block">TRIGGER TYPE</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as AlertType }))}
                  className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green"
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {!["rsi-overbought","rsi-oversold","earnings-upcoming","news-bullish","news-bearish","volume-spike"].includes(form.type) && (
                <div>
                  <label className="text-xs text-genius-muted font-mono mb-1.5 block">VALUE / THRESHOLD</label>
                  <input
                    type="text"
                    value={form.threshold}
                    onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                    placeholder={
                      form.type === "price-above" || form.type === "price-below"
                        ? "e.g. $85,000"
                        : form.type === "ai-signal"
                        ? "e.g. BUY 90%+"
                        : "e.g. +$1,000"
                    }
                    className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-genius-muted/50 focus:outline-none focus:border-genius-green"
                  />
                </div>
              )}

              {["rsi-overbought","rsi-oversold","earnings-upcoming","news-bullish","news-bearish","volume-spike"].includes(form.type) && (
                <div className="p-3 rounded-lg bg-genius-green/5 border border-genius-green/20">
                  <p className="text-xs text-genius-green font-mono">
                    {form.type === "rsi-overbought"    && "Fires automatically when RSI crosses above 70"}
                    {form.type === "rsi-oversold"      && "Fires automatically when RSI drops below 30"}
                    {form.type === "earnings-upcoming" && "Fires automatically 3 days before earnings date"}
                    {form.type === "news-bullish"      && "AI scans news 24/7 and fires on bullish sentiment"}
                    {form.type === "news-bearish"      && "AI scans news 24/7 and fires on bearish sentiment"}
                    {form.type === "volume-spike"      && "Fires automatically when volume exceeds 2× the 20-day average"}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (["rsi-overbought","rsi-oversold","earnings-upcoming","news-bullish","news-bearish","volume-spike"].includes(form.type)) {
                    setForm(f => ({ ...f, threshold: "auto" }));
                    setTimeout(addAlert, 0);
                  } else {
                    addAlert();
                  }
                }}
                className="w-full py-3 rounded-lg btn-genius font-bold text-sm"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
