"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUser, getUser } from "@/lib/auth";
import {
  Brain, Zap, Shield, TrendingUp, Globe, Bitcoin,
  BarChart3, ChevronRight, Check, Cpu, Activity,
  DollarSign, Layers, Lock, Star
} from "lucide-react";

// ── Asset universe ────────────────────────────────────────────────────────────
const ASSET_GROUPS = [
  {
    id: "tech",
    label: "US Tech Giants",
    icon: Cpu,
    tickers: ["AAPL", "NVDA", "MSFT", "GOOGL", "META", "AMZN"],
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    id: "etf",
    label: "ETFs & Index Funds",
    icon: BarChart3,
    tickers: ["SPY", "QQQ", "SOXX", "ARKK"],
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    dot: "bg-purple-400",
  },
  {
    id: "crypto",
    label: "Crypto Markets",
    icon: Bitcoin,
    tickers: ["BTC", "ETH", "SOL", "AVAX"],
    color: "from-orange-500/20 to-yellow-500/20",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    dot: "bg-orange-400",
  },
  {
    id: "growth",
    label: "High-Growth Stocks",
    icon: TrendingUp,
    tickers: ["TSLA", "AMD", "PLTR", "CRWD"],
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
    glow: "shadow-green-500/20",
    dot: "bg-green-400",
  },
  {
    id: "global",
    label: "Global Markets",
    icon: Globe,
    tickers: ["EWJ", "FXI", "EEM", "VGK"],
    color: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500/30",
    glow: "shadow-teal-500/20",
    dot: "bg-teal-400",
  },
  {
    id: "commodities",
    label: "Energy & Commodities",
    icon: Layers,
    tickers: ["XOM", "GLD", "USO", "LNG"],
    color: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
    dot: "bg-red-400",
  },
];

const RISK_PROFILES = [
  {
    id: "conservative",
    label: "Steady Growth",
    sublabel: "Conservative",
    desc: "Blue-chip focus. Smaller positions, lower volatility. Aims for consistent 8–14% annually with minimal drawdowns.",
    stats: [
      { label: "Max position", value: "5%" },
      { label: "Trades/week", value: "2–4" },
      { label: "Asset types", value: "Stocks + ETFs" },
    ],
    icon: Shield,
    color: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/30",
  },
  {
    id: "moderate",
    label: "Balanced Edge",
    sublabel: "Moderate",
    desc: "Growth meets discipline. Broader universe, momentum signals, managed risk. Target 18–28% annually.",
    stats: [
      { label: "Max position", value: "10%" },
      { label: "Trades/week", value: "5–10" },
      { label: "Asset types", value: "All stocks + ETFs" },
    ],
    icon: Activity,
    color: "text-genius-green",
    border: "border-genius-green/40",
    bg: "bg-genius-green/10",
    glow: "shadow-genius-green/30",
    recommended: true,
  },
  {
    id: "aggressive",
    label: "Maximum Alpha",
    sublabel: "Aggressive",
    desc: "Full conviction trading. High-momentum plays, crypto exposure, concentrated positions. Target 35–60%+ annually. High risk.",
    stats: [
      { label: "Max position", value: "20%" },
      { label: "Trades/week", value: "10–20" },
      { label: "Asset types", value: "All + Crypto" },
    ],
    icon: Zap,
    color: "text-orange-400",
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    glow: "shadow-orange-500/30",
  },
];

const AMOUNTS = [
  { label: "$500",    value: 500 },
  { label: "$1,000",  value: 1000 },
  { label: "$2,500",  value: 2500 },
  { label: "$5,000",  value: 5000 },
  { label: "$10,000", value: 10000 },
  { label: "$25,000", value: 25000 },
  { label: "$50,000", value: 50000 },
  { label: "Custom",  value: 0 },
];

const CONFIDENCE_LEVELS = [
  { value: 70, label: "70%", desc: "More trades, wider net" },
  { value: 80, label: "80%", desc: "Balanced frequency" },
  { value: 90, label: "90%", desc: "Only highest conviction" },
];

// ── Boot sequence lines ───────────────────────────────────────────────────────
const BOOT_LINES = [
  "Initializing GreenGenius neural engine...",
  "Loading market intelligence modules...",
  "Connecting to live data feeds (NYSE, NASDAQ, Crypto)...",
  "Calibrating risk parameters...",
  "Running portfolio optimization algorithms...",
  "Syncing watchlist configuration...",
  "AI trading engine armed and ready.",
  "⚡ Your AI is now active.",
];

// ── Main component ────────────────────────────────────────────────────────────
function OnboardingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const plan   = params.get("plan") || "genius";

  const [step, setStep] = useState(0);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["tech", "etf"]);
  const [riskProfile, setRiskProfile]       = useState("moderate");
  const [amount, setAmount]                 = useState(5000);
  const [customAmount, setCustomAmount]     = useState("");
  const [confidence, setConfidence]         = useState(80);
  const [rebalance, setRebalance]           = useState("weekly");
  const [bootLines, setBootLines]           = useState<string[]>([]);
  const [done, setDone]                     = useState(false);

  const toggleAsset = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((a) => a !== id) : prev) : [...prev, id]
    );
  };

  // Boot sequence animation
  useEffect(() => {
    if (step !== 3) return;
    setBootLines([]);
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setDone(true), 600);
        }
      }, i * 420);
    });
  }, [step]);

  const handleLaunch = () => {
    const user = getUser();
    if (user) {
      saveUser({ ...user, riskProfile: riskProfile as any, botActive: true });
    }
    router.push("/dashboard");
  };

  const effectiveAmount = customAmount ? parseInt(customAmount.replace(/\D/g, "")) || 0 : amount;

  const stepTitles = [
    "Choose Your Markets",
    "Set Capital & Risk",
    "Fine-Tune Your AI",
    "Activating",
  ];

  return (
    <div className="min-h-screen bg-genius-black text-white">
      {/* ── Top bar ── */}
      <div className="border-b border-genius-border bg-genius-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={16} className="text-genius-black" />
            </div>
            <span className="font-black text-white">GreenGeniusAI</span>
            <span className="text-xs text-genius-muted ml-2 font-mono uppercase">
              {plan} plan
            </span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  step > i
                    ? "bg-genius-green text-genius-black"
                    : step === i
                    ? "border-2 border-genius-green text-genius-green"
                    : "border border-genius-border text-genius-muted"
                }`}>
                  {step > i ? <Check size={12} /> : i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-8 h-px transition-all duration-500 ${step > i ? "bg-genius-green" : "bg-genius-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-genius-border">
          <div
            className="h-full bg-genius-green transition-all duration-500"
            style={{ width: `${Math.min((step / 3) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* ── STEP 0: Asset Universe ── */}
        {step === 0 && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <p className="text-genius-green font-mono text-xs font-bold mb-3 tracking-widest">STEP 1 OF 3</p>
              <h1 className="text-4xl font-black text-white mb-3">
                Which markets should your<br />
                <span className="text-genius-green">AI hunt in?</span>
              </h1>
              <p className="text-genius-muted text-sm">Select all that apply. The AI will only trade within these universes.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {ASSET_GROUPS.map((group) => {
                const selected = selectedAssets.includes(group.id);
                const Icon = group.icon;
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleAsset(group.id)}
                    className={`relative rounded-2xl p-5 text-left border transition-all duration-200 ${
                      selected
                        ? `bg-gradient-to-br ${group.color} ${group.border} shadow-lg ${group.glow}`
                        : "border-genius-border bg-genius-card hover:border-genius-green/30"
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-genius-green flex items-center justify-center">
                        <Check size={10} className="text-genius-black" />
                      </div>
                    )}
                    <Icon size={22} className={selected ? group.dot.replace("bg-", "text-") : "text-genius-muted"} />
                    <p className={`font-bold text-sm mt-3 mb-2 ${selected ? "text-white" : "text-genius-text"}`}>
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {group.tickers.map((t) => (
                        <span key={t} className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          selected ? "bg-white/10 text-white" : "bg-genius-black/50 text-genius-muted"
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-genius-muted">
                {selectedAssets.length} universe{selectedAssets.length !== 1 ? "s" : ""} selected
              </p>
              <button
                onClick={() => setStep(1)}
                className="btn-genius px-8 py-3.5 rounded-xl font-black flex items-center gap-2"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Capital & Risk ── */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <p className="text-genius-green font-mono text-xs font-bold mb-3 tracking-widest">STEP 2 OF 3</p>
              <h1 className="text-4xl font-black text-white mb-3">
                Capital & <span className="text-genius-green">Risk Profile</span>
              </h1>
              <p className="text-genius-muted text-sm">Tell the AI how much firepower it has and how hard to push.</p>
            </div>

            {/* Capital */}
            <div className="genius-card rounded-2xl p-6 border border-genius-border mb-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign size={18} className="text-genius-green" />
                <h2 className="font-black text-white">Starting Capital</h2>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {AMOUNTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => { setAmount(a.value); if (a.value !== 0) setCustomAmount(""); }}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                      (a.value === 0 && customAmount) || (a.value !== 0 && amount === a.value && !customAmount)
                        ? "bg-genius-green text-genius-black"
                        : "border border-genius-border text-genius-muted hover:border-genius-green hover:text-genius-green"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              {(amount === 0 || customAmount) && (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-genius-green font-black text-lg">$</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter amount"
                    className="w-full bg-genius-black border border-genius-green rounded-xl pl-8 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-genius-green/30"
                    autoFocus
                  />
                </div>
              )}
              {effectiveAmount > 0 && (
                <p className="text-xs text-genius-muted mt-3">
                  AI will manage up to <span className="text-genius-green font-bold">${effectiveAmount.toLocaleString()}</span> across your selected markets.
                </p>
              )}
            </div>

            {/* Risk */}
            <div className="genius-card rounded-2xl p-6 border border-genius-border mb-8">
              <div className="flex items-center gap-2 mb-5">
                <Activity size={18} className="text-genius-green" />
                <h2 className="font-black text-white">Risk Tolerance</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {RISK_PROFILES.map((r) => {
                  const Icon = r.icon;
                  const selected = riskProfile === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRiskProfile(r.id)}
                      className={`relative rounded-2xl p-5 text-left border transition-all duration-200 ${
                        selected
                          ? `${r.bg} ${r.border} shadow-lg ${r.glow}`
                          : "border-genius-border bg-genius-black hover:border-genius-border/60"
                      }`}
                    >
                      {r.recommended && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-genius-green rounded-full text-genius-black text-xs font-black">
                          RECOMMENDED
                        </div>
                      )}
                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-genius-green flex items-center justify-center">
                          <Check size={10} className="text-genius-black" />
                        </div>
                      )}
                      <Icon size={22} className={r.color} />
                      <p className={`font-black text-base mt-3 ${selected ? "text-white" : "text-genius-text"}`}>{r.label}</p>
                      <p className={`text-xs mb-3 ${r.color}`}>{r.sublabel}</p>
                      <p className="text-xs text-genius-muted leading-relaxed mb-4">{r.desc}</p>
                      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                        {r.stats.map((s) => (
                          <div key={s.label} className="flex justify-between">
                            <span className="text-xs text-genius-muted">{s.label}</span>
                            <span className={`text-xs font-bold ${selected ? r.color : "text-genius-text"}`}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl border border-genius-border text-genius-muted hover:text-white transition-colors font-bold text-sm">
                ← Back
              </button>
              <button onClick={() => setStep(2)} className="btn-genius px-8 py-3.5 rounded-xl font-black flex items-center gap-2">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: AI Fine-Tuning ── */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <p className="text-genius-green font-mono text-xs font-bold mb-3 tracking-widest">STEP 3 OF 3</p>
              <h1 className="text-4xl font-black text-white mb-3">
                Fine-Tune Your <span className="text-genius-green">AI Brain</span>
              </h1>
              <p className="text-genius-muted text-sm">Advanced parameters. You can change these anytime from your dashboard.</p>
            </div>

            {/* Confidence threshold */}
            <div className="genius-card rounded-2xl p-6 border border-genius-border mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-genius-green" />
                  <h2 className="font-black text-white">Minimum Trade Confidence</h2>
                </div>
                <span className="text-genius-green font-black text-xl">{confidence}%</span>
              </div>
              <p className="text-xs text-genius-muted mb-5">Only execute trades when the AI is at least this confident in the signal.</p>
              <div className="grid grid-cols-3 gap-3">
                {CONFIDENCE_LEVELS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setConfidence(c.value)}
                    className={`py-3 rounded-xl text-center border transition-all duration-150 ${
                      confidence === c.value
                        ? "bg-genius-green/20 border-genius-green text-genius-green"
                        : "border-genius-border text-genius-muted hover:border-genius-green/40"
                    }`}
                  >
                    <p className="font-black text-lg">{c.label}</p>
                    <p className="text-xs mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Rebalance frequency */}
            <div className="genius-card rounded-2xl p-6 border border-genius-border mb-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-genius-green" />
                <h2 className="font-black text-white">Portfolio Rebalance Frequency</h2>
              </div>
              <p className="text-xs text-genius-muted mb-5">How often the AI reviews and rebalances overall portfolio allocation.</p>
              <div className="grid grid-cols-5 gap-3">
                {["Daily", "Weekly", "Bi-weekly", "Monthly", "One-time"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setRebalance(f.toLowerCase())}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all duration-150 ${
                      rebalance === f.toLowerCase()
                        ? "bg-genius-green/20 border-genius-green text-genius-green"
                        : "border-genius-border text-genius-muted hover:border-genius-green/40"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Config summary */}
            <div className="genius-card rounded-2xl p-6 border border-genius-green/20 bg-genius-green/5 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} className="text-genius-green" />
                <h3 className="font-black text-white text-sm">Your AI Configuration Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-genius-muted text-xs mb-1">Markets</p>
                  <p className="text-white font-bold">
                    {selectedAssets.map((id) => ASSET_GROUPS.find((g) => g.id === id)?.label.split(" ")[0]).join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-genius-muted text-xs mb-1">Capital</p>
                  <p className="text-white font-bold">${effectiveAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-genius-muted text-xs mb-1">Risk Profile</p>
                  <p className="text-white font-bold capitalize">{riskProfile}</p>
                </div>
                <div>
                  <p className="text-genius-muted text-xs mb-1">Min Confidence</p>
                  <p className="text-white font-bold">{confidence}%</p>
                </div>
                <div>
                  <p className="text-genius-muted text-xs mb-1">Rebalance</p>
                  <p className="text-white font-bold capitalize">{rebalance}</p>
                </div>
                <div>
                  <p className="text-genius-muted text-xs mb-1">Plan</p>
                  <p className="text-genius-green font-bold capitalize">{plan}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-genius-border text-genius-muted hover:text-white transition-colors font-bold text-sm">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-genius px-10 py-4 rounded-xl font-black text-lg flex items-center gap-3 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap size={20} />
                  Activate My AI
                </span>
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Boot sequence ── */}
        {step === 3 && (
          <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              {/* AI core visual */}
              <div className="flex justify-center mb-10">
                <div className="relative">
                  <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                    done ? "border-genius-green bg-genius-green/20 shadow-[0_0_60px_rgba(0,255,65,0.4)]" : "border-genius-green/50 bg-genius-green/5"
                  }`}>
                    <Brain size={48} className={`transition-colors duration-500 ${done ? "text-genius-green" : "text-genius-green/60"}`} />
                  </div>
                  {!done && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-genius-green/20 animate-ping" />
                      <div className="absolute -inset-4 rounded-full border border-genius-green/10 animate-pulse" />
                    </>
                  )}
                  {done && (
                    <div className="absolute -inset-3 rounded-full border-2 border-genius-green/30 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Terminal */}
              <div className="bg-black rounded-2xl border border-genius-green/30 p-6 font-mono text-sm mb-8">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-genius-border">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="text-genius-muted text-xs ml-2">ggai-engine — boot</span>
                </div>
                <div className="space-y-1.5 min-h-[200px]">
                  {bootLines.map((line, i) => (
                    <div key={i} className={`flex items-start gap-2 ${i === bootLines.length - 1 ? "text-genius-green" : "text-genius-muted"}`}>
                      <span className="text-genius-green/40 select-none">›</span>
                      <span>{line}</span>
                    </div>
                  ))}
                  {!done && <span className="inline-block w-2 h-4 bg-genius-green animate-pulse ml-4" />}
                </div>
              </div>

              {done && (
                <div className="text-center animate-fadeIn">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="live-dot" />
                    <span className="text-genius-green font-mono text-sm font-bold">AI IS LIVE</span>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Your AI is hunting the market.</h2>
                  <p className="text-genius-muted text-sm mb-8">
                    It's analyzing thousands of signals right now. You'll get an alert the moment it makes a move.
                  </p>
                  <button
                    onClick={handleLaunch}
                    className="btn-genius px-12 py-4 rounded-xl font-black text-lg flex items-center gap-3 mx-auto"
                  >
                    <BarChart3 size={20} />
                    Go to My Dashboard
                    <ChevronRight size={20} />
                  </button>
                  <div className="flex items-center justify-center gap-6 mt-6 text-xs text-genius-muted">
                    <span className="flex items-center gap-1.5"><Lock size={10} className="text-genius-green" /> Secured</span>
                    <span className="flex items-center gap-1.5"><Shield size={10} className="text-genius-green" /> SIPC Protected</span>
                    <span className="flex items-center gap-1.5"><Zap size={10} className="text-genius-green" /> AI Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-genius-black flex items-center justify-center">
        <div className="text-genius-green font-mono animate-pulse">Loading...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
