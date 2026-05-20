"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User, CreditCard, Brain, Bell, Shield, ChevronRight,
  CheckCircle, ExternalLink, Zap, Globe, Lock,
  Activity, RefreshCw, TrendingUp, AlertTriangle, Cpu,
  Link2, Eye, EyeOff, Wifi, WifiOff,
} from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import {
  getBotConfig, saveBotConfig,
  ASSET_SYMBOLS, ASSET_GROUP_META,
  estimateTradesPerWeek, nextRebalanceDate,
  type AssetGroup, type RebalanceFrequency, type BotConfig,
} from "@/lib/bot-config";

const ALL_GROUPS: AssetGroup[] = [
  "US Tech Stocks","Crypto Assets","Index ETFs","High-Growth","Global Equities","Commodities",
];

const PLAN_FEATURES: Record<string,{name:string;price:string;features:string[]}> = {
  analyst: { name: "Analyst", price: "$10/mo",    features: ["5 AI trades/day","Basic signals","Email alerts","1 asset class"] },
  genius:  { name: "Genius",  price: "$29.99/mo", features: ["Unlimited AI trades","Advanced signals","All asset classes","Priority support","SMS alerts"] },
  elite:   { name: "Elite",   price: "$49.99/mo", features: ["Everything in Genius","Dedicated AI model","Custom strategies","White-glove support","API access"] },
};

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
  const [plan,    setPlan]     = useState("genius");

  // Notifications
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: false, ai: true, trades: true, news: false });

  // Broker / Alpaca
  const [alpacaKey,      setAlpacaKey]      = useState("");
  const [alpacaSecret,   setAlpacaSecret]   = useState("");
  const [alpacaPaper,    setAlpacaPaper]    = useState(true);
  const [showKey,        setShowKey]        = useState(false);
  const [showSecret,     setShowSecret]     = useState(false);
  const [brokerSaved,    setBrokerSaved]    = useState(false);
  const [brokerSaving,   setBrokerSaving]   = useState(false);
  const [brokerStatus,   setBrokerStatus]   = useState<"idle"|"testing"|"connected"|"error">("idle");
  const [brokerError,    setBrokerError]    = useState("");
  const [brokerPortfolio, setBrokerPortfolio] = useState<{value:number;cash:number;buyingPower:number}|null>(null);

  // AI Bot Config
  const [confidence,   setConfidence]   = useState<number>(80);
  const [frequency,    setFrequency]    = useState<RebalanceFrequency>("Weekly");
  const [universe,     setUniverse]     = useState<AssetGroup[]>(["US Tech Stocks","Crypto Assets","Index ETFs"]);
  const [maxPositions, setMaxPositions] = useState(10);
  const [autoCompound, setAutoCompound] = useState(true);
  const [stopLoss,     setStopLoss]     = useState(0);
  const [botActive,    setBotActive]    = useState(true);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile(p => ({ ...p, name: user.name || "", email: user.email || "" }));
      setPlan((user as any).plan || "genius");
    }
    // Load saved Alpaca keys from localStorage
    setAlpacaKey(localStorage.getItem("ggai_alpaca_key") ?? "");
    setAlpacaSecret(localStorage.getItem("ggai_alpaca_secret") ?? "");
    setAlpacaPaper(localStorage.getItem("ggai_alpaca_paper") !== "false");
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
  }, []);

  const handleSaveBroker = async () => {
    setBrokerSaving(true);
    localStorage.setItem("ggai_alpaca_key",    alpacaKey.trim());
    localStorage.setItem("ggai_alpaca_secret", alpacaSecret.trim());
    localStorage.setItem("ggai_alpaca_paper",  String(alpacaPaper));
    setBrokerSaving(false);
    setBrokerSaved(true);
    setTimeout(() => setBrokerSaved(false), 3000);
  };

  const handleTestBroker = async () => {
    if (!alpacaKey || !alpacaSecret) return;
    setBrokerStatus("testing");
    setBrokerError("");
    try {
      const res = await fetch("/api/bot/status", {
        headers: {
          "x-alpaca-key":    alpacaKey.trim(),
          "x-alpaca-secret": alpacaSecret.trim(),
          "x-alpaca-paper":  String(alpacaPaper),
        },
      });
      const data = await res.json();
      if (data.connected) {
        setBrokerStatus("connected");
        setBrokerPortfolio({ value: data.portfolio_value, cash: data.cash, buyingPower: data.buying_power });
      } else {
        setBrokerStatus("error");
        setBrokerError(data.reason ?? "Connection failed");
      }
    } catch (e: any) {
      setBrokerStatus("error");
      setBrokerError(e.message);
    }
  };

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

  const [tradeMin, tradeMax] = estimateTradesPerWeek(confidence, universe);
  const totalSymbols = universe.reduce((n, g) => n + (ASSET_SYMBOLS[g]?.length ?? 0), 0);
  const nextRebalance = nextRebalanceDate(frequency);
  const threshInfo = THRESHOLD_INFO[confidence] ?? THRESHOLD_INFO[80];

  const SECTIONS = [
    { id: "ai",           icon: Brain,      label: "AI Configuration" },
    { id: "broker",       icon: Link2,      label: "Connect Broker" },
    { id: "profile",      icon: User,       label: "Profile" },
    { id: "subscription", icon: CreditCard, label: "Subscription" },
    { id: "notifications",icon: Bell,       label: "Notifications" },
    { id: "security",     icon: Shield,     label: "Security" },
  ];

  const currentPlan = PLAN_FEATURES[plan] || PLAN_FEATURES.genius;

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

          {/* Bot status mini-card */}
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

              {/* Config editor */}
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

                {/* Save button */}
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
                    { label: "Symbols Monitored", value: String(totalSymbols),           sub: `across ${universe.length} groups`,        color: "text-genius-green" },
                    { label: "Trades / Week",      value: `${tradeMin}–${tradeMax}`,      sub: `at ${confidence}% confidence`,           color: "text-genius-green" },
                    { label: "Next Rebalance",     value: nextRebalance,                  sub: frequency,                                color: "text-genius-muted" },
                    { label: "Max Positions",      value: String(maxPositions),           sub: autoCompound ? "auto-compound on" : "compounding off", color: "text-genius-green" },
                  ].map(m => (
                    <div key={m.label} className="bg-genius-black rounded-xl p-3 border border-genius-border text-center">
                      <p className="text-xs text-genius-muted font-mono mb-1">{m.label}</p>
                      <p className={`font-black text-base ${m.color} leading-tight`}>{m.value}</p>
                      <p className="text-xs text-genius-muted font-mono mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Active symbol tags */}
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

              {/* Reset wizard */}
              <div className="genius-card rounded-xl p-4 border border-genius-green/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-genius-green" />
                  <h3 className="font-bold text-white text-sm">Re-run Setup Wizard</h3>
                </div>
                <p className="text-xs text-genius-muted mb-3">Redo your full AI onboarding configuration from scratch.</p>
                <button
                  onClick={() => { window.location.href = "/onboarding"; }}
                  className="flex items-center gap-2 text-sm text-genius-green font-semibold hover:underline"
                >
                  Launch Onboarding Wizard <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ── BROKER CONNECTION ── */}
          {section === "broker" && (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="genius-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={16} className="text-genius-green" />
                  <h2 className="font-bold text-white">Connect Your Broker</h2>
                </div>
                <p className="text-xs text-genius-muted mb-6">
                  Link your Alpaca brokerage account so the AI bot can execute real trades on your behalf. Your keys are stored locally and never sent to our servers.
                </p>

                {/* Paper / Live toggle */}
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-genius-black border border-genius-border">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Trading Mode</p>
                    <p className="text-xs text-genius-muted">Paper trading uses fake money — safe for testing.</p>
                  </div>
                  <div className="flex rounded-lg overflow-hidden border border-genius-border text-xs font-bold font-mono">
                    <button
                      onClick={() => setAlpacaPaper(true)}
                      className={`px-4 py-2 transition-colors ${alpacaPaper ? "bg-genius-green text-genius-black" : "bg-genius-black text-genius-muted hover:text-white"}`}
                    >
                      PAPER
                    </button>
                    <button
                      onClick={() => setAlpacaPaper(false)}
                      className={`px-4 py-2 transition-colors ${!alpacaPaper ? "bg-red-500 text-white" : "bg-genius-black text-genius-muted hover:text-white"}`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                {!alpacaPaper && (
                  <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Live mode uses <strong>real money</strong>. The AI will place actual orders in your Alpaca account. Proceed only if you understand the risks.</span>
                  </div>
                )}

                {/* API Key inputs */}
                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">ALPACA API KEY ID</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={alpacaKey}
                        onChange={e => setAlpacaKey(e.target.value)}
                        placeholder="PK..."
                        className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-genius-green transition-colors pr-10"
                      />
                      <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-genius-muted hover:text-white">
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-genius-muted font-mono mb-1.5 block">ALPACA SECRET KEY</label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={alpacaSecret}
                        onChange={e => setAlpacaSecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className="w-full bg-genius-black border border-genius-border rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-genius-green transition-colors pr-10"
                      />
                      <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-genius-muted hover:text-white">
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                {brokerStatus === "connected" && brokerPortfolio && (
                  <div className="mb-5 p-4 rounded-xl bg-genius-green/10 border border-genius-green/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="live-dot" />
                      <span className="text-sm font-bold text-genius-green">Connected — {alpacaPaper ? "Paper Account" : "Live Account"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Portfolio Value", value: `$${brokerPortfolio.value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` },
                        { label: "Cash Balance",    value: `$${brokerPortfolio.cash.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` },
                        { label: "Buying Power",    value: `$${brokerPortfolio.buyingPower.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <p className="text-xs text-genius-muted font-mono">{m.label}</p>
                          <p className="text-base font-black text-genius-green">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {brokerStatus === "error" && (
                  <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    <WifiOff size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Connection failed: {brokerError}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveBroker}
                    disabled={brokerSaving || !alpacaKey || !alpacaSecret}
                    className="px-6 py-2.5 rounded-xl btn-genius text-sm font-black flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {brokerSaving ? (
                      <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                    ) : brokerSaved ? (
                      <><CheckCircle size={14} /> Keys Saved!</>
                    ) : (
                      <><Lock size={14} /> Save Keys Locally</>
                    )}
                  </button>
                  <button
                    onClick={handleTestBroker}
                    disabled={brokerStatus === "testing" || !alpacaKey || !alpacaSecret}
                    className="px-6 py-2.5 rounded-xl border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {brokerStatus === "testing" ? (
                      <><RefreshCw size={14} className="animate-spin" /> Testing...</>
                    ) : brokerStatus === "connected" ? (
                      <><Wifi size={14} /> Re-Test Connection</>
                    ) : (
                      <><Wifi size={14} /> Test Connection</>
                    )}
                  </button>
                </div>
              </div>

              {/* How to get keys */}
              <div className="genius-card rounded-xl p-5 border border-genius-border">
                <h3 className="font-bold text-white mb-3 text-sm">How to get your Alpaca API keys</h3>
                <ol className="flex flex-col gap-2 text-sm text-genius-muted">
                  {[
                    <>Go to <a href="https://app.alpaca.markets" target="_blank" rel="noopener" className="text-genius-green hover:underline">app.alpaca.markets</a> and create a free account.</>,
                    "Navigate to Paper Trading → API Keys (or Live Trading for real money).",
                    'Click "Generate New Key" — copy both the Key ID and Secret Key.',
                    "Paste them above, choose Paper or Live mode, then Save & Test.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-genius-green/20 text-genius-green text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2 p-4 rounded-xl bg-genius-black border border-genius-border text-xs text-genius-muted">
                <Lock size={12} className="mt-0.5 flex-shrink-0 text-genius-green" />
                <span>Your API keys are stored only in your browser's localStorage. They are sent directly to Alpaca's servers and never stored on GreenGeniusAI servers.</span>
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

          {/* Subscription */}
          {section === "subscription" && (
            <div className="flex flex-col gap-4">
              <div className="genius-card rounded-xl p-6 border border-genius-green/25">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-genius-green/20 text-genius-green border border-genius-green/30 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                      <span className="text-xs text-genius-muted font-mono">Founding Member</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{currentPlan.name} Plan</h2>
                    <p className="text-genius-green font-mono font-bold text-xl mt-1">{currentPlan.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-genius-muted font-mono">Next billing</p>
                    <p className="text-white font-semibold">June 18, 2026</p>
                    <p className="text-xs text-genius-muted mt-1">7-day free trial active</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {currentPlan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-genius-green flex-shrink-0" />
                      <span className="text-sm text-genius-text">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard/billing" className="px-5 py-2.5 rounded-lg border border-genius-green/40 text-genius-green text-sm font-bold hover:bg-genius-green/10 transition-colors">
                    Manage Billing
                  </Link>
                  {plan !== "elite" && (
                    <Link href="/upgrade" className="px-5 py-2.5 rounded-lg btn-genius text-sm font-bold">
                      Upgrade to Elite
                    </Link>
                  )}
                </div>
              </div>
              <div className="genius-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">Usage This Month</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "AI Trades Executed", value: "47",  limit: "∞",   pct: 47 },
                    { label: "API Calls",          value: "312", limit: "5,000", pct: 6 },
                    { label: "Alerts Triggered",   value: "18",  limit: "∞",   pct: 18 },
                  ].map(u => (
                    <div key={u.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-genius-muted font-mono">{u.label}</span>
                        <span className="text-white font-mono font-bold">{u.value}<span className="text-genius-muted">/{u.limit}</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-genius-border rounded-full">
                        <div className="h-full bg-genius-green rounded-full" style={{width:`${Math.min(u.pct,100)}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                  {["Cancel Subscription","Delete Account"].map(a => (
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
