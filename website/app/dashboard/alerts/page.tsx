"use client";

import { useState } from "react";
import {
  Bell, Plus, X, CheckCircle, AlertTriangle, TrendingUp,
  TrendingDown, Brain, Trash2, ToggleLeft, ToggleRight, Clock,
} from "lucide-react";

type AlertItem = {
  id: number;
  type: "price-above" | "price-below" | "ai-signal" | "pnl-loss" | "pnl-gain";
  sym: string;
  value: string;
  label: string;
  active: boolean;
  triggered: boolean;
  ago?: string;
  icon: any;
  color: string;
};

const INITIAL_ALERTS: AlertItem[] = [
  { id: 1,  type: "price-above", sym: "BTC",  value: "$85,000", label: "BTC price above $85,000",       active: true,  triggered: false, icon: TrendingUp,    color: "text-genius-green" },
  { id: 2,  type: "price-below", sym: "NVDA", value: "$820",    label: "NVDA price below $820",          active: true,  triggered: false, icon: TrendingDown,  color: "text-red-400" },
  { id: 3,  type: "pnl-loss",    sym: "ALL",  value: "−$500",   label: "Daily P&L below −$500",          active: true,  triggered: false, icon: AlertTriangle, color: "text-yellow-400" },
  { id: 4,  type: "ai-signal",   sym: "SOL",  value: "BUY 90%+",label: "AI BUY signal on SOL ≥ 90%",    active: true,  triggered: false, icon: Brain,         color: "text-genius-green" },
  { id: 5,  type: "price-above", sym: "ETH",  value: "$3,500",  label: "ETH price above $3,500",         active: false, triggered: false, icon: TrendingUp,    color: "text-genius-green" },
  { id: 6,  type: "pnl-gain",    sym: "ALL",  value: "+$1,000", label: "Portfolio gains exceed +$1,000", active: true,  triggered: false, icon: CheckCircle,   color: "text-genius-emerald" },
];

const HISTORY = [
  { sym: "NVDA", label: "NVDA crossed +$900 — Alert triggered",   time: "2h ago",  type: "price-above", outcome: "Price continued to $947" },
  { sym: "BTC",  label: "BTC dropped below $74,000 — Alert fired", time: "Yesterday",type: "price-below", outcome: "Bounced +6% within 4h" },
  { sym: "ALL",  label: "Daily P&L exceeded +$800 — AI notified", time: "2d ago",  type: "pnl-gain",    outcome: "Bot locked in gains" },
  { sym: "SOL",  label: "AI Strong Buy signal on SOL fired 92%",   time: "3d ago",  type: "ai-signal",   outcome: "Position entered, +8.3%" },
];

const SYMBOLS = ["BTC","ETH","SOL","NVDA","AAPL","MSFT","META","AMD","TSLA","AMZN","ALL"];
const TYPES   = [
  { value: "price-above", label: "Price rises above" },
  { value: "price-below", label: "Price falls below" },
  { value: "pnl-gain",    label: "Portfolio P&L exceeds (gain)" },
  { value: "pnl-loss",    label: "Portfolio P&L hits (loss)" },
  { value: "ai-signal",   label: "AI signal fires" },
];

export default function AlertsPage() {
  const [alerts,  setAlerts]  = useState<AlertItem[]>(INITIAL_ALERTS);
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ sym: "BTC", type: "price-above", threshold: "" });

  const toggleAlert = (id: number) =>
    setAlerts(a => a.map(x => x.id===id ? {...x, active:!x.active} : x));

  const deleteAlert = (id: number) =>
    setAlerts(a => a.filter(x => x.id !== id));

  const addAlert = () => {
    if (!form.threshold) return;
    const newAlert: AlertItem = {
      id:        Date.now(),
      type:      form.type as any,
      sym:       form.sym,
      value:     form.threshold,
      label:     `${TYPES.find(t=>t.value===form.type)?.label} ${form.threshold} on ${form.sym}`,
      active:    true,
      triggered: false,
      icon:      form.type.includes("above") || form.type.includes("gain") ? TrendingUp : form.type==="ai-signal" ? Brain : TrendingDown,
      color:     form.type.includes("loss") || form.type.includes("below") ? "text-red-400" : "text-genius-green",
    };
    setAlerts(a => [newAlert, ...a]);
    setForm({ sym: "BTC", type: "price-above", threshold: "" });
    setShowNew(false);
  };

  const activeCount   = alerts.filter(a => a.active).length;
  const triggeredToday = 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Alerts</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">{activeCount} active · {triggeredToday} triggered today</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold"
        >
          <Plus size={14} /> New Alert
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Alerts",    value: activeCount,    color: "text-genius-green",   icon: Bell },
          { label: "Triggered Today",  value: triggeredToday, color: "text-yellow-400",     icon: AlertTriangle },
          { label: "AI Alerts",        value: alerts.filter(a=>a.type==="ai-signal").length, color: "text-genius-emerald", icon: Brain },
          { label: "P&L Alerts",       value: alerts.filter(a=>a.type.includes("pnl")).length, color: "text-genius-muted", icon: TrendingUp },
        ].map((k,i) => (
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

      <div className="grid grid-cols-5 gap-6">
        {/* Active alerts */}
        <div className="col-span-3 genius-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-genius-border">
            <h2 className="font-bold text-white">Active Alert Rules</h2>
          </div>
          <div className="flex flex-col divide-y divide-genius-border/40">
            {alerts.map(a => (
              <div key={a.id} className={`px-5 py-4 hover:bg-genius-card transition-colors ${!a.active ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.active ? "bg-genius-green/10" : "bg-genius-border"}`}>
                      <a.icon size={14} className={a.active ? a.color : "text-genius-muted"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{a.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono bg-genius-border text-genius-muted px-1.5 py-0.5 rounded">{a.sym}</span>
                        <span className="text-xs text-genius-muted font-mono">{a.type.replace("-"," ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
            ))}
          </div>
        </div>

        {/* History + notification channels */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Alert history */}
          <div className="genius-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-genius-border">
              <h2 className="font-bold text-white text-sm">Trigger History</h2>
            </div>
            <div className="flex flex-col divide-y divide-genius-border/40">
              {HISTORY.map((h,i) => (
                <div key={i} className="px-4 py-3 hover:bg-genius-card transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs text-genius-text leading-snug flex-1 pr-2">{h.label}</p>
                    <span className="text-xs text-genius-muted font-mono flex-shrink-0 flex items-center gap-1">
                      <Clock size={10} /> {h.time}
                    </span>
                  </div>
                  <p className="text-xs text-genius-muted">→ {h.outcome}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notification channels */}
          <div className="genius-card rounded-xl p-4">
            <h2 className="font-bold text-white text-sm mb-3">Notification Channels</h2>
            <div className="flex flex-col gap-3">
              {[
                { channel: "In-App",      desc: "Dashboard bell notifications", enabled: true },
                { channel: "Email",       desc: "jaden@greengeniusai.com",       enabled: true },
                { channel: "SMS / Text",  desc: "(480) 798-0753",                enabled: false },
                { channel: "Push (iOS)",  desc: "Mobile app required",           enabled: false },
              ].map(c => (
                <div key={c.channel} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.channel}</p>
                    <p className="text-xs text-genius-muted">{c.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${c.enabled ? "bg-genius-green" : "bg-genius-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${c.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New alert modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="genius-card rounded-2xl p-6 max-w-md w-full border border-genius-border glow-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">Create Alert</h3>
              <button onClick={() => setShowNew(false)} className="text-genius-muted hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-genius-muted font-mono mb-1.5 block">ASSET</label>
                <select
                  value={form.sym}
                  onChange={e => setForm(f => ({...f, sym: e.target.value}))}
                  className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-genius-green"
                >
                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-genius-muted font-mono mb-1.5 block">TRIGGER TYPE</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({...f, type: e.target.value}))}
                  className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green"
                >
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-genius-muted font-mono mb-1.5 block">VALUE / THRESHOLD</label>
                <input
                  type="text"
                  value={form.threshold}
                  onChange={e => setForm(f => ({...f, threshold: e.target.value}))}
                  placeholder="e.g. $85,000 or 90%"
                  className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-genius-muted/50 focus:outline-none focus:border-genius-green"
                />
              </div>
              <button
                onClick={addAlert}
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
