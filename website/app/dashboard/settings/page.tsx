"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User, Brain, Bell, Shield, ChevronRight,
  CheckCircle, Zap, Globe, Lock,
  Activity, RefreshCw, TrendingUp, AlertTriangle, Cpu,
  Bot, DollarSign, RotateCcw, Eye, EyeOff, Wifi, WifiOff,
} from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import {
  getBotConfig, saveBotConfig,
  ASSET_SYMBOLS, ASSET_GROUP_META,
  estimateTradesPerWeek, nextRebalanceDate,
  type AssetGroup, type RebalanceFrequency, type BotConfig,
} from "@/lib/bot-config";
import { loadPaperPortfolio, resetPaperPortfolio } from "@/lib/paper-trading";

const ALL_GROUPS: AssetGroup[] = [
  "US Tech Stocks","Crypto Assets","Index ETFs","High-Growth","Global Equities","Commodities",
];

const THRESHOLD_INFO: Record<number,{label:string;desc:string;color:string}> = {
  70: { label: "Aggressive",    desc: "More trades, higher activity, wider signal net",       color: "text-yellow-400" },
  80: { label: "Balanced",      desc: "Optimal mix of frequency and precision — recommended", color: "text-genius-green" },
  90: { label: "Conservative",  desc: "Fewer, higher-conviction trades only",                 color: "text-genius-emerald" },
};

const FREQ_ICONS: Record<RebalanceFrequency, string> = {
  Daily: "⚡", Weekly: "📅", "Bi-weekly": "🔄", Monthly: "📆", "One-time": "1️⃣", Manual: "🎛️",
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const [section, setSection] = useState(() => searchParams.get("section") ?? "ai");
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty,   setDirty]   = useState(false);

  // Profile
  const [profile, setProfile] = useState({ name: "", email: "", phone: "(480) 798-0753" });

  // Notifications
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: false, ai: true, trades: true, news: false });

  // AI Bot Config
  const [confidence,   setConfidence]   = useState<number>(80);
  const [frequency,    setFrequency]    = useState<RebalanceFrequency>("Weekly");
  const [universe,     setUniverse]     = useState<AssetGroup[]>(["US Tech Stocks","Crypto Assets","Index ETFs"]);
  const [maxPositions, setMaxPositions] = useState(10);
  const [autoCompound, setAutoCompound] = useState(true);
  const [stopLoss,     setStopLoss]     = useState(0);
  const [botActive,    setBotActive]    = useState(true);

  // Portfolio stats for Account section
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioCash,  setPortfolioCash]  = useState(0);
  const [resetConfirm,   setResetConfirm]   = useState(false);

  // Alpaca connection
  const [alpacaKey,    setAlpacaKey]    = useState("");
  const [alpacaSecret, setAlpacaSecret] = useState("");
  const [alpacaPaper,  setAlpacaPaper]  = useState(true);
  const [showKey,      setShowKey]      = useState(false);
  const [showSecret,   setShowSecret]   = useState(false);
  const [connStatus,   setConnStatus]   = useState<"idle"|"testing"|"connected"|"error">("idle");
  const [connData,     setConnData]     = useState<{value:number;cash:number;buyingPower:number}|null>(null);
  const [keySaved,     setKeySaved]     = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile(p => ({ ...p, name: user.name || "", email: user.email || "" }));
    }
    const cfg = getBotConfig();
    setConfidence(cfg.confidenceThreshold);
    setFrequency(cfg.rebalanceFrequency);
    setUniverse(cfg.assetUniverse);
    setMaxPositions(cfg.maxPositions);
    setAutoCompound(cfg.autoCompound);
    setStopLoss(cfg.stopLossOverride);
    setBotActive(cfg.botActive);
    if (cfg.updatedAt) {
      setLastSaved(new Date(cfg.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
    const p = loadPaperPortfolio();
    setPortfolioValue(p.cash + Object.values(p.positions).reduce((s, pos) => s + pos.shares * pos.avgEntry, 0));
    setPortfolioCash(p.cash);
    // Load saved Alpaca keys
    setAlpacaKey(localStorage.getItem("ggai_alpaca_key") ?? "");
    setAlpacaSecret(localStorage.getItem("ggai_alpaca_secret") ?? "");
    setAlpacaPaper(localStorage.getItem("ggai_alpaca_paper") !== "false");
  }, []);

  const toggleGroup = (g: AssetGroup) => {
    setUniverse(u => u.includes(g) ? (u.length > 1 ? u.filter(x => x !== g) : u) : [...u, g]);
    setDirty(true);
  };

  const handleSaveAI = async () => {
    if (universe.length === 0) return;
    setSaving(true);
    const cfg: Partial<BotConfig> = {
      confidenceThreshold: confidence,
      rebalanceFrequency: frequency,
      assetUniverse: universe,
      maxPositions,
      autoCompound,
      stopLossOverride: stopLoss,
      botActive,
    };
    saveBotConfig(cfg);
    try {
      await fetch("/api/bot-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
    } catch {}
    setSaving(false);
    setSaved(true);
    setDirty(false);
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLastSaved(t);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveKeys = () => {
    localStorage.setItem("ggai_alpaca_key",    alpacaKey.trim());
    localStorage.setItem("ggai_alpaca_secret", alpacaSecret.trim());
    localStorage.setItem("ggai_alpaca_paper",  String(alpacaPaper));
    setKeySaved(true);
    setConnStatus("idle");
    setConnData(null);
    setTimeout(() => setKeySaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!alpacaKey || !alpacaSecret) return;
    setConnStatus("testing");
    try {
      const res  = await fetch("/api/bot/status", {
        headers: {
          "x-alpaca-key":    alpacaKey,
          "x-alpaca-secret": alpacaSecret,
          "x-alpaca-paper":  String(alpacaPaper),
        },
      });
      const data = await res.json();
      if (data.connected) {
        setConnStatus("connected");
        setConnData({ value: data.portfolio_value, cash: data.cash, buyingPower: data.buying_power });
      } else {
        setConnStatus("error");
      }
    } catch {
      setConnStatus("error");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("ggai_alpaca_key");
    localStorage.removeItem("ggai_alpaca_secret");
    setAlpacaKey("");
    setAlpacaSecret("");
    setConnStatus("idle");
    setConnData(null);
  };

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetPaperPortfolio();
    const p = loadPaperPortfolio();
    setPortfolioValue(p.cash);
    setPortfolioCash(p.cash);
    setResetConfirm(false);
  };

  const [tradeMin, tradeMax] = estimateTradesPerWeek(confidence, universe);
  const totalSymbols = universe.reduce((n, g) => n + (ASSET_SYMBOLS[g]?.length ?? 0), 0);
  const nextRebalance = nextRebalanceDate(frequency);
  const threshInfo = THRESHOLD_INFO[confidence] ?? THRESHOLD_INFO[80];

  const SECTIONS = [
    { id: "ai",            icon: Brain,       label: "AI Configuration" },
    { id: "account",       icon: Bot,         label: "Account" },
    { id: "profile",       icon: User,        label: "Profile" },
    { id: "notifications", icon: Bell,        label: "Notifications" },
    { id: "security",      icon: Shield,      label: "Security" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-xs text-genius-muted font-mono mt-0.5">Account management · AI configuration · Security</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Nav */}
        <div className="col-span-1">
          <div className="genius-card rounded-xl overflow-hidden">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-b border-genius-border/40 last:border-0 ${
                  section === s.id
                    ? "bg-genius-green/10 text-genius-green font-semibold"
                    : "text-genius-muted hover:text-white hover:bg-genius-card"
                }`}
              >
                <s.icon size={15} />
                {s.label}
                {s.id === "ai" && dirty && <span className="ml-auto w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />}
                {section === s.id && !dirty && <ChevronRight size={12} className="ml-auto" />}
              </button>
            ))}
          </div>

          {section === "ai" && (
            <div className={`mt-3 genius-card rounded-xl p-3 border ${botActive ? "border-genius-green/25" : "border-genius-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-genius-muted">BOT STATUS</span>
                <button
                  onClick={() => { setBotActive(b => !b); setDirty(true); }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${botActive ? "bg-genius-green" : "bg-genius-border"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${botActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {botActive ? (
                  <><div className="live-dot" /><span className="text-xs text-genius-green font-mono font-bold">ACTIVE</span></>
                ) : (
                  <><div className="w-1.5 h-1.5 rounded-full bg-genius-muted" /><span className="text-xs text-genius-muted font-mono">PAUSED</span></>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="col-span-3">

          {/* ── AI CONFIGURATION ── */}
          {section === "ai" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-genius-green" />
                    <h2 className="font-bold text-white">AI Bot Configuration</h2>
                  </div>
                  {lastSaved && !dirty && (
                    <span className="text-xs text-genius-muted font-mono flex items-center gap-1">
                      <CheckCircle size={10} className="text-genius-green" /> Saved at {lastSaved}
                    </span>
                  )}
                  {dirty && (
                    <span className="text-xs text-yellow-400 font-mono flex items-center gap-1">
                      <AlertTriangle size={10} /> Unsaved changes
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  {/* Confidence threshold */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-genius-muted font-mono">MINIMUM CONFIDENCE THRESHOLD</label>
                      <span className={`text-xs font-bold font-mono ${threshInfo.color}`}>{threshInfo.label}</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {[70, 80, 90].map(v => (
                        <button
                          key={v}
                          onClick={() => { setConfidence(v); setDirty(true); }}
                          className={`flex-1 py-3 rounded-xl border text-sm font-black font-mono transition-all ${
                            confidence === v
                              ? "border-genius-green bg-genius-green/15 text-genius-green shadow-genius"
                              : "border-genius-border text-genius-muted hover:text-white hover:border-genius-green/40"
                          }`}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-genius-muted">{threshInfo.desc}</p>
                  </div>

                  {/* Rebalance frequency */}
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-2 block">REBALANCE FREQUENCY</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {(["Daily","Weekly","Bi-weekly","Monthly","One-time","Manual"] as RebalanceFrequency[]).map(f => (
                        <button
                          key={f}
                          onClick={() => { setFrequency(f); setDirty(true); }}
                          className={`py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            frequency === f
                              ? "border-genius-green bg-genius-green/15 text-genius-green"
                              : "border-genius-border text-genius-muted hover:text-white hover:border-genius-green/30"
                          }`}
                        >
                          <span>{FREQ_ICONS[f]}</span> {f}
                        </button>
                      ))}
                    </div>
                    {frequency !== "Manual" && frequency !== "One-time" && (
                      <p className="text-xs text-genius-muted font-mono">
                        Next rebalance: <span className="text-genius-green">{nextRebalance}</span>
                      </p>
                    )}
                  </div>

                  {/* Asset universe */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-genius-muted font-mono">ASSET UNIVERSE</label>
                      <span className="text-xs text-genius-green font-mono font-bold">{totalSymbols} symbols active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_GROUPS.map(g => {
                        const active  = universe.includes(g);
                        const meta    = ASSET_GROUP_META[g];
                        const symbols = ASSET_SYMBOLS[g];
                        return (
                          <button
                            key={g}
                            onClick={() => toggleGroup(g)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              active
                                ? "border-genius-green/40 bg-genius-green/8 text-white"
                                : "border-genius-border text-genius-muted hover:border-genius-green/25"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                              active ? "bg-genius-green border-genius-green" : "border-genius-border"
                            }`}>
                              {active && <CheckCircle size={11} className="text-genius-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{meta.emoji}</span>
                                <span className={`text-sm font-semibold ${active ? "text-white" : "text-genius-muted"}`}>{g}</span>
                              </div>
                              <p className={`text-xs font-mono mt-0.5 ${active ? "text-genius-muted" : "text-genius-muted/50"}`}>
                                {symbols.slice(0,5).join(", ")}{symbols.length > 5 ? " +" + (symbols.length-5) : ""}
                              </p>
                            </div>
                            <span className={`text-xs font-mono font-bold flex-shrink-0 ${active ? "text-genius-green" : "text-genius-muted/50"}`}>
                              {symbols.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {universe.length === 1 && (
                      <p className="text-xs text-yellow-400 font-mono mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={10} /> At least one group must be selected
                      </p>
                    )}
                  </div>

                  {/* Advanced settings */}
                  <div className="border-t border-genius-border pt-5">
                    <p className="text-xs text-genius-muted font-mono mb-4">ADVANCED SETTINGS</p>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="text-sm font-semibold text-white">Max Open Positions</label>
                          <span className="font-mono font-black text-genius-green">{maxPositions}</span>
                        </div>
                        <input
                          type="range" min={3} max={25} step={1} value={maxPositions}
                          onChange={e => { setMaxPositions(Number(e.target.value)); setDirty(true); }}
                          className="w-full h-1.5 appearance-none bg-genius-border rounded-full cursor-pointer accent-genius-green"
                        />
                        <div className="flex justify-between text-xs text-genius-muted font-mono mt-1">
                          <span>3 (focused)</span><span>25 (diversified)</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="text-sm font-semibold text-white">Global Stop-Loss</label>
                          <span className="font-mono font-black text-genius-green">{stopLoss === 0 ? "Per-position" : `${stopLoss}%`}</span>
                        </div>
                        <input
                          type="range" min={0} max={25} step={1} value={stopLoss}
                          onChange={e => { setStopLoss(Number(e.target.value)); setDirty(true); }}
                          className="w-full h-1.5 appearance-none bg-genius-border rounded-full cursor-pointer accent-genius-green"
                        />
                        <div className="flex justify-between text-xs text-genius-muted font-mono mt-1">
                          <span>Per-position</span><span>25%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-genius-black border border-genius-border">
                      <div>
                        <p className="text-sm font-semibold text-white">Auto-Compound Profits</p>
                        <p className="text-xs text-genius-muted">Reinvest gains into highest-conviction signals</p>
                      </div>
                      <button
                        onClick={() => { setAutoCompound(a => !a); setDirty(true); }}
                        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${autoCompound ? "bg-genius-green" : "bg-genius-border"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoCompound ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSaveAI}
                    disabled={saving || !dirty}
                    className="px-8 py-3 rounded-xl btn-genius text-sm font-black flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                    ) : saved ? (
                      <><CheckCircle size={14} /> Configuration Applied!</>
                    ) : (
                      <><Zap size={14} /> Apply Configuration</>
                    )}
                  </button>
                  {saved && (
                    <span className="text-xs text-genius-green font-mono animate-fadeIn flex items-center gap-1">
                      <Activity size={11} /> Bot updated and trading with new rules
                    </span>
                  )}
                </div>
              </div>

              {/* Live preview panel */}
              <div className="genius-card rounded-xl p-5 border border-genius-green/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="live-dot" />
                  <h3 className="font-bold text-white text-sm">Live Bot Preview</h3>
                  <span className="text-xs text-genius-muted font-mono ml-auto">What your bot will do with current settings</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Symbols Monitored", value: String(totalSymbols),      sub: `across ${universe.length} groups`,        color: "text-genius-green" },
                    { label: "Trades / Week",      value: `${tradeMin}–${tradeMax}`, sub: `at ${confidence}% confidence`,           color: "text-genius-green" },
                    { label: "Next Rebalance",     value: nextRebalance,             sub: frequency,                                color: "text-genius-muted" },
                    { label: "Max Positions",      value: String(maxPositions),      sub: autoCompound ? "auto-compound on" : "compounding off", color: "text-genius-green" },
                  ].map(m => (
                    <div key={m.label} className="bg-genius-black rounded-xl p-3 border border-genius-border text-center">
                      <p className="text-xs text-genius-muted font-mono mb-1">{m.label}</p>
                      <p className={`font-black text-base ${m.color} leading-tight`}>{m.value}</p>
                      <p className="text-xs text-genius-muted font-mono mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-genius-muted font-mono mb-2">ACTIVE TRADING UNIVERSE</p>
                  <div className="flex flex-wrap gap-1.5">
                    {universe.flatMap(g => ASSET_SYMBOLS[g]).map(sym => (
                      <span key={sym} className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-genius-green/10 text-genius-green border border-genius-green/20">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {section === "account" && (
            <div className="flex flex-col gap-4">

              {/* Alpaca connection card */}
              <div className={`genius-card rounded-xl p-6 border ${connStatus === "connected" ? "border-genius-green/40" : "border-genius-border"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={16} className="text-genius-green" />
                  <h2 className="font-bold text-white">Trading Account</h2>
                  {connStatus === "connected" && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-mono font-bold text-genius-green">
                      <Wifi size={12} /> CONNECTED {alpacaPaper ? "· PAPER" : "· LIVE"}
                    </span>
                  )}
                  {connStatus === "error" && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                      <WifiOff size={12} /> CONNECTION FAILED
                    </span>
                  )}
                </div>
                <p className="text-xs text-genius-muted mb-5">
                  Connect your Alpaca account so the AI bot can trade your real funds automatically. Keys are stored only on your device.
                </p>

                {/* Connected portfolio preview */}
                {connStatus === "connected" && connData && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Portfolio Value", value: `$${connData.value.toLocaleString("en-US",{minimumFractionDigits:2})}` },
                      { label: "Cash",            value: `$${connData.cash.toLocaleString("en-US",{minimumFractionDigits:2})}` },
                      { label: "Buying Power",    value: `$${connData.buyingPower.toLocaleString("en-US",{minimumFractionDigits:2})}` },
                    ].map(m => (
                      <div key={m.label} className="bg-genius-black rounded-xl p-3 border border-genius-green/20 text-center">
                        <p className="text-xs text-genius-muted font-mono mb-1">{m.label}</p>
                        <p className="font-black text-sm text-genius-green">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* API Key */}
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">ALPACA API KEY</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={alpacaKey}
                        onChange={e => setAlpacaKey(e.target.value)}
                        placeholder="PKXXXXXXXXXXXXXXXX"
                        className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 pr-10 text-white text-sm font-mono focus:outline-none focus:border-genius-green transition-colors"
                      />
                      <button type="button" onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-genius-muted hover:text-white transition-colors">
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">ALPACA SECRET KEY</label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={alpacaSecret}
                        onChange={e => setAlpacaSecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 pr-10 text-white text-sm font-mono focus:outline-none focus:border-genius-green transition-colors"
                      />
                      <button type="button" onClick={() => setShowSecret(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-genius-muted hover:text-white transition-colors">
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Paper / Live toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-genius-black border border-genius-border">
                    <div>
                      <p className="text-sm font-semibold text-white">Paper Trading Mode</p>
                      <p className="text-xs text-genius-muted">Use Alpaca paper account — no real money at risk</p>
                    </div>
                    <button
                      onClick={() => setAlpacaPaper(v => !v)}
                      className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${alpacaPaper ? "bg-genius-green" : "bg-red-500"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${alpacaPaper ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {!alpacaPaper && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
                      <AlertTriangle size={12} /> LIVE MODE — real funds will be traded. Confirm before running bot.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleSaveKeys}
                      className="px-5 py-2.5 rounded-xl btn-genius text-sm font-black flex items-center gap-2"
                    >
                      {keySaved ? <><CheckCircle size={14} /> Saved!</> : <><Lock size={14} /> Save Keys</>}
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={!alpacaKey || !alpacaSecret || connStatus === "testing"}
                      className="px-5 py-2.5 rounded-xl border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {connStatus === "testing" ? (
                        <><RefreshCw size={14} className="animate-spin" /> Testing…</>
                      ) : connStatus === "connected" ? (
                        <><Wifi size={14} /> Connected</>
                      ) : (
                        <><Activity size={14} /> Test Connection</>
                      )}
                    </button>
                    {(alpacaKey || connStatus === "connected") && (
                      <button
                        onClick={handleDisconnect}
                        className="px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-genius-muted">
                    Get your API keys at{" "}
                    <a href="https://app.alpaca.markets" target="_blank" rel="noopener noreferrer" className="text-genius-green hover:underline">
                      app.alpaca.markets ↗
                    </a>
                    {" "}· Keys never leave your device
                  </p>
                </div>
              </div>

              {/* How to fund / withdraw */}
              <div className="genius-card rounded-xl p-5 border border-genius-border">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={14} className="text-genius-green" />
                  <h3 className="font-bold text-white text-sm">Funding & Withdrawals</h3>
                </div>
                <p className="text-xs text-genius-muted leading-relaxed mb-3">
                  Deposit and withdraw real funds directly through your Alpaca account. Alpaca supports instant ACH transfers, wire transfers, and connects to most major banks.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://app.alpaca.markets/paper-trading/overview"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold"
                  >
                    <TrendingUp size={13} /> Fund Account ↗
                  </a>
                  <a
                    href="https://app.alpaca.markets/paper-trading/overview"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors"
                  >
                    Withdraw ↗
                  </a>
                </div>
              </div>

              {/* Reset local portfolio */}
              <div className="genius-card rounded-xl p-5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw size={13} className="text-red-400" />
                  <h3 className="font-bold text-white text-sm">Reset Local Portfolio</h3>
                </div>
                <p className="text-xs text-genius-muted mb-4">
                  Clears local trade history and balance. Does not affect your real Alpaca account.
                </p>
                {resetConfirm ? (
                  <div className="flex items-center gap-3">
                    <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                      Confirm Reset
                    </button>
                    <button onClick={() => setResetConfirm(false)} className="px-4 py-2 rounded-lg border border-genius-border text-genius-muted text-sm font-semibold hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
                    <RotateCcw size={13} /> Reset Local Portfolio
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Profile */}
          {section === "profile" && (
            <div className="genius-card rounded-xl p-6">
              <h2 className="font-bold text-white mb-5">Profile Information</h2>
              <div className="flex flex-col gap-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">FULL NAME</label>
                    <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))}
                      className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">EMAIL ADDRESS</label>
                    <input value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))}
                      className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-genius-muted font-mono mb-1.5 block">PHONE NUMBER</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))}
                    className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-genius-muted font-mono mb-1.5 block">TIMEZONE</label>
                  <select className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-genius-green">
                    <option>America/Phoenix (MST)</option>
                    <option>America/New_York (EST)</option>
                    <option>America/Chicago (CST)</option>
                    <option>America/Los_Angeles (PST)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
                {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Changes"}
              </button>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="genius-card rounded-xl p-6">
              <h2 className="font-bold text-white mb-5">Notification Preferences</h2>
              <div className="flex flex-col gap-1 divide-y divide-genius-border/40">
                {[
                  { key: "trades", label: "Trade Executions",  desc: "Notify when AI places or exits a trade" },
                  { key: "ai",     label: "AI Insights",        desc: "Daily AI market outlook and signal alerts" },
                  { key: "email",  label: "Email Summaries",    desc: "Weekly portfolio performance digest" },
                  { key: "news",   label: "Market News",        desc: "Breaking news that may affect your positions" },
                  { key: "sms",    label: "SMS Alerts",         desc: "Critical alerts via text message" },
                  { key: "push",   label: "Push Notifications", desc: "Mobile app push (requires app install)" },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{n.label}</p>
                      <p className="text-xs text-genius-muted">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs(prev => ({...prev, [n.key]: !(prev as any)[n.key]}))}
                      className={`w-11 h-6 rounded-full relative transition-colors ${(notifs as any)[n.key] ? "bg-genius-green" : "bg-genius-border"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(notifs as any)[n.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="mt-4 px-6 py-2.5 rounded-lg btn-genius text-sm font-bold flex items-center gap-2">
                {saved ? <><CheckCircle size={14} /> Saved!</> : "Save Preferences"}
              </button>
            </div>
          )}

          {/* Security */}
          {section === "security" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6">
                <h2 className="font-bold text-white mb-5">Security</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { icon: Lock,   label: "Password",                  sub: "Last changed 14 days ago",        action: "Change", color: "text-genius-green" },
                    { icon: Shield, label: "Two-Factor Authentication", sub: "Adds an extra layer of protection", action: "Enable", color: "text-genius-green" },
                    { icon: Globe,  label: "Active Sessions",           sub: "1 active session · Gilbert, AZ",  action: "Revoke All", color: "text-red-400" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between p-4 bg-genius-black rounded-xl border border-genius-border">
                      <div className="flex items-center gap-3">
                        <r.icon size={16} className={r.color} />
                        <div>
                          <p className="text-sm font-semibold text-white">{r.label}</p>
                          <p className="text-xs text-genius-muted">{r.sub}</p>
                        </div>
                      </div>
                      <button className={`text-sm ${r.color} font-semibold hover:underline`}>{r.action}</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="genius-card rounded-xl p-5 border border-red-500/20">
                <h3 className="font-bold text-white mb-1">Danger Zone</h3>
                <p className="text-xs text-genius-muted mb-4">Irreversible account actions</p>
                <div className="flex flex-col gap-2">
                  {["Delete Account"].map(a => (
                    <button key={a} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-colors">
                      <span className="text-sm text-red-400 font-semibold">{a}</span>
                      <ChevronRight size={14} className="text-red-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
