"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Brain, Shield, Zap, Bell,
  ChevronRight, Star, Lock, Globe, ArrowUpRight, BarChart3,
  DollarSign, RefreshCw, CheckCircle, Menu, X, Play, Pause,
  Activity, AlertTriangle, Eye, Settings
} from "lucide-react";

// ─── Ticker type ─────────────────────────────────────────────────────────────
type Ticker = { sym: string; price: string; change: string; up: boolean };

const FALLBACK_TICKERS: Ticker[] = [
  { sym: "AAPL", price: "---", change: "---", up: true },
  { sym: "NVDA", price: "---", change: "---", up: true },
  { sym: "TSLA", price: "---", change: "---", up: false },
  { sym: "MSFT", price: "---", change: "---", up: true },
  { sym: "BTC",  price: "---", change: "---", up: true },
  { sym: "ETH",  price: "---", change: "---", up: true },
  { sym: "SOL",  price: "---", change: "---", up: true },
  { sym: "SPY",  price: "---", change: "---", up: true },
  { sym: "AMZN", price: "---", change: "---", up: false },
  { sym: "GOOGL",price: "---", change: "---", up: true },
  { sym: "META", price: "---", change: "---", up: true },
  { sym: "AMD",  price: "---", change: "---", up: true },
];

// ─── AI Trade log entries ────────────────────────────────────────────────────
const AI_TRADES = [
  {
    action: "BUY",
    asset: "NVDA",
    amount: "$2,400",
    time: "2m ago",
    reason: "Earnings beat consensus by 18%. GPU demand from AI sector accelerating. RSI showing momentum continuation. Options flow: 87% bullish.",
  },
  {
    action: "SELL",
    asset: "TSLA",
    amount: "$1,100",
    time: "14m ago",
    reason: "Delivery miss signals demand softening. Margin compression trend detected. Moving avg crossover bearish. Exiting before further downside.",
  },
  {
    action: "BUY",
    asset: "BTC",
    amount: "$850",
    time: "31m ago",
    reason: "Halving cycle historically produces 6-18 month bull run. Institutional inflows at 3-month high. On-chain accumulation signal triggered.",
  },
  {
    action: "BUY",
    asset: "SOL",
    amount: "$620",
    time: "1h ago",
    reason: "Network activity up 44% MoM. Developer activity surging. Breakout above key resistance with volume confirmation.",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Genius-Level AI Engine",
    desc: "Trained on 20+ years of market data, earnings reports, macro events, and sentiment signals. Makes decisions in milliseconds that take analysts hours.",
  },
  {
    icon: Activity,
    title: "Live Market Intelligence",
    desc: "Real-time feeds from NYSE, NASDAQ, crypto markets, options flow, insider filings, Fed announcements, and social sentiment — all analyzed simultaneously.",
  },
  {
    icon: Bell,
    title: "Full Trade Transparency",
    desc: "Every buy and sell comes with a plain-English explanation of exactly why the AI made that decision. No black boxes. You're always in control.",
  },
  {
    icon: Shield,
    title: "Risk-Aware Portfolio Management",
    desc: "Dynamically adjusts position sizes based on your risk profile. Automatically hedges during high-volatility windows. Capital preservation is priority one.",
  },
  {
    icon: Settings,
    title: "Bot On / Bot Off Mode",
    desc: "Let the AI run fully autonomous, or flip it off and use GreenGeniusAI as your premium research and portfolio dashboard. Your money, your rules.",
  },
  {
    icon: Zap,
    title: "Trend Interception Engine",
    desc: "Detects emerging asset trends 48–72 hours before mainstream awareness using proprietary pattern recognition across 10,000+ data points per second.",
  },
];

const PLANS = [
  {
    name: "Genius",
    price: "14.99",
    period: "month",
    highlight: true,
    badge: "Founding Member",
    features: [
      "Full AI auto-investing engine",
      "Live market data & alerts",
      "Transparent trade reasoning",
      "Bot on/off manual mode",
      "All asset classes (stocks, ETFs, crypto)",
      "Risk profile customization",
      "Priority notifications",
      "Portfolio analytics dashboard",
      "Email & push trade alerts",
    ],
  },
];

const STATS = [
  { label: "Assets Monitored", value: "10,000+", sub: "in real-time" },
  { label: "Avg Monthly Return", value: "14.2%", sub: "backtested 2019–2024" },
  { label: "Trade Accuracy", value: "78.4%", sub: "win rate on exits" },
  { label: "Response Time", value: "<50ms", sub: "from signal to trade" },
];

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Software Engineer",
    stars: 5,
    text: "I've tried every investing app. GreenGeniusAI is the first one that actually explains WHY it's making moves. Made back my subscription in the first week.",
  },
  {
    name: "Destiny R.",
    role: "Nurse Practitioner",
    stars: 5,
    text: "I know nothing about stocks. Set it up in 10 minutes, turned the bot on, and just watch it work. Up 22% in 3 months. Incredible.",
  },
  {
    name: "Jordan K.",
    role: "Real Estate Investor",
    stars: 5,
    text: "The trend detection is insane. It caught the NVDA run before everyone. And when it sold TSLA right before the drop, I was floored.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTradeIdx, setActiveTradeIdx] = useState(0);
  const [botActive, setBotActive] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(12847.33);
  const [tickerData, setTickerData] = useState<Ticker[]>(FALLBACK_TICKERS);

  // Fetch live prices on mount and every 30 seconds
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch("/api/ticker");
        if (res.ok) {
          const data = await res.json();
          if (data?.length) setTickerData(data);
        }
      } catch {}
    };
    fetchTickers();
    const iv = setInterval(fetchTickers, 30000);
    return () => clearInterval(iv);
  }, []);

  // Simulate live portfolio ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue((v) => {
        const delta = (Math.random() - 0.35) * 8;
        return Math.max(10000, v + delta);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through AI trades
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTradeIdx((i) => (i + 1) % AI_TRADES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-genius-black matrix-bg">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-genius-border bg-genius-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={18} className="text-genius-black" />
              </div>
              <span className="font-black text-xl text-white">
                Green<span className="text-genius-green">Genius</span>AI
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How It Works", "Pricing", "Trust"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  className="text-sm text-genius-muted hover:text-genius-green transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth" className="text-sm text-genius-muted hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth?mode=signup"
                className="btn-genius px-5 py-2 rounded-lg text-sm font-bold"
              >
                Claim Founding Access
              </Link>
            </div>

            {/* Mobile menu */}
            <button
              className="md:hidden text-genius-muted"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-genius-border bg-genius-dark px-6 py-4 flex flex-col gap-4">
            {["Features", "How It Works", "Pricing", "Trust"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-genius-muted hover:text-genius-green"
                onClick={() => setMenuOpen(false)}
              >
                {l}
              </a>
            ))}
            <Link href="/auth?mode=signup" className="btn-genius px-5 py-3 rounded-lg text-center font-bold">
              Claim Founding Access
            </Link>
          </div>
        )}
      </nav>

      {/* ── LIVE TICKER ── */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-genius-card border-b border-genius-border py-2 overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {[...tickerData, ...tickerData].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 mr-8">
                <span className="font-mono font-bold text-xs text-white">{t.sym}</span>
                <span className="font-mono text-xs text-genius-muted">${t.price}</span>
                <span className={`font-mono text-xs font-bold ${t.up ? "text-genius-green" : "text-red-400"}`}>
                  {t.up ? <TrendingUp size={10} className="inline mr-1" /> : <TrendingDown size={10} className="inline mr-1" />}
                  {t.change}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-genius-border bg-genius-card mb-6">
                <div className="live-dot" />
                <span className="text-xs font-mono text-genius-green font-bold">LIVE MARKET INTELLIGENCE</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                The AI That<br />
                <span className="text-genius-green glow-text">Invests Like</span><br />
                A Genius
              </h1>

              <p className="text-lg text-genius-text leading-relaxed mb-8 max-w-lg">
                GreenGeniusAI automatically detects the hottest trending assets, buys in at the perfect moment, and exits before the decline — then tells you <em>exactly</em> why it made every move. Founding member rate: $14.99/month.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth?mode=signup"
                  className="btn-genius px-8 py-4 rounded-xl text-base font-black flex items-center justify-center gap-2"
                >
                  Claim Founding Access
                  <ChevronRight size={18} />
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 rounded-xl border border-genius-border text-genius-text hover:border-genius-green hover:text-genius-green transition-all flex items-center justify-center gap-2 text-base font-semibold"
                >
                  <Play size={16} />
                  See It In Action
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 text-xs text-genius-muted">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-genius-green" /> Bank-level encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield size={12} className="text-genius-green" /> SEC-compliant infrastructure
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-genius-green" /> Cancel anytime
                </span>
              </div>
            </div>

            {/* Right — Live AI dashboard mockup */}
            <div className="relative">
              {/* Main card */}
              <div className="genius-card rounded-2xl p-6 glow-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-genius-muted font-mono">PORTFOLIO VALUE</p>
                    <p className="text-3xl font-black text-white font-mono">
                      ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-genius-green font-mono mt-1">+$1,847.33 (+16.8%) all time</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-genius-muted font-mono">AI BOT</span>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={botActive} onChange={() => setBotActive(!botActive)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                    <span className={`text-xs font-mono font-bold ${botActive ? "text-genius-green" : "text-genius-muted"}`}>
                      {botActive ? "● ACTIVE" : "○ MANUAL"}
                    </span>
                  </div>
                </div>

                {/* Mini chart bars */}
                <div className="flex items-end gap-1 h-16 mb-4">
                  {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100, 88, 96].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        background: i >= 10 ? "linear-gradient(to top, #00FF41, #00D97E)" : "rgba(0,255,65,0.2)",
                      }}
                    />
                  ))}
                </div>

                {/* Latest AI trade */}
                <div className="border-t border-genius-border pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-black font-mono ${AI_TRADES[activeTradeIdx].action === "BUY" ? "bg-genius-green text-genius-black" : "bg-red-500 text-white"}`}>
                      {AI_TRADES[activeTradeIdx].action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{AI_TRADES[activeTradeIdx].asset}</span>
                        <span className="text-xs text-genius-muted">{AI_TRADES[activeTradeIdx].amount} · {AI_TRADES[activeTradeIdx].time}</span>
                      </div>
                      <p className="text-xs text-genius-text leading-relaxed line-clamp-2">
                        {AI_TRADES[activeTradeIdx].reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {AI_TRADES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i === activeTradeIdx ? "bg-genius-green" : "bg-genius-border"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute -top-4 -right-4 genius-card rounded-xl p-3 border border-genius-border shadow-genius">
                <p className="text-xs text-genius-muted font-mono">TODAY</p>
                <p className="text-lg font-black text-genius-green font-mono">+$342.18</p>
              </div>
              <div className="absolute -bottom-4 -left-4 genius-card rounded-xl p-3 border border-genius-border shadow-genius">
                <div className="flex items-center gap-2">
                  <div className="live-dot" />
                  <p className="text-xs text-genius-green font-mono font-bold">AI SCANNING 10K+ ASSETS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-4 border-y border-genius-border bg-genius-card">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl lg:text-4xl font-black text-genius-green glow-text mb-1">{s.value}</p>
              <p className="font-bold text-white text-sm mb-1">{s.label}</p>
              <p className="text-xs text-genius-muted">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">HOW IT WORKS</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              From Signal to Trade<br />in Under <span className="text-genius-green">50 Milliseconds</span>
            </h2>
            <p className="text-genius-text max-w-2xl mx-auto">
              GreenGeniusAI doesn't just follow trends — it predicts them. Here's how the intelligence engine works.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {[
              { step: "01", icon: Globe, title: "Ingest Everything", desc: "Pulls live data from 50+ sources: price feeds, earnings, Fed statements, social sentiment, options flow, insider trading filings, crypto on-chain data." },
              { step: "02", icon: Brain, title: "AI Pattern Recognition", desc: "Proprietary model trained on 20 years of market data identifies high-probability setups and emerging asset momentum before they hit mainstream news." },
              { step: "03", icon: Zap, title: "Execute & Explain", desc: "Executes the optimal trade and sends you a plain-English breakdown of exactly why it acted — not a black box, a transparent genius partner." },
              { step: "04", icon: Eye, title: "Monitor & Exit", desc: "Continuously watches every position for deterioration signals. The moment the momentum shifts, it exits before the loss compounds." },
            ].map((s) => (
              <div key={s.step} className="genius-card rounded-2xl p-6 relative overflow-hidden">
                <span className="absolute top-4 right-4 text-6xl font-black text-genius-border font-mono">{s.step}</span>
                <div className="w-10 h-10 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center mb-4">
                  <s.icon size={20} className="text-genius-green" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-genius-text leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI TRADE FEED ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-genius-green font-mono text-sm font-bold mb-3">FULL TRANSPARENCY</p>
              <h2 className="text-4xl font-black text-white mb-4">
                Every Trade Comes<br />With a <span className="text-genius-green">Reason</span>
              </h2>
              <p className="text-genius-text mb-8 leading-relaxed">
                No other AI investing app tells you why. GreenGeniusAI explains its reasoning in plain English for every single buy and sell — so you learn while you earn. You're never in the dark about what's happening with your money.
              </p>
              <div className="flex flex-col gap-3">
                {["Push notification + email on every trade", "Plain-English AI reasoning", "Confidence score per trade", "Option to override any decision"].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-genius-green flex-shrink-0" />
                    <span className="text-genius-text text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {AI_TRADES.map((t, i) => (
                <div key={i} className="genius-card rounded-xl p-4 border border-genius-border hover:border-genius-green/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono flex-shrink-0 ${t.action === "BUY" ? "bg-genius-green/20 text-genius-green border border-genius-green/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                      {t.action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{t.asset}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-genius-green">{t.amount}</span>
                          <span className="text-xs text-genius-muted">{t.time}</span>
                        </div>
                      </div>
                      <p className="text-xs text-genius-text leading-relaxed">{t.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">FEATURES</p>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Built Different.<br />Performs <span className="text-genius-green">Different.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="genius-card rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-genius-green" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-genius-text leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOT MODE TOGGLE DEMO ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-genius-green font-mono text-sm font-bold mb-3">TWO MODES, ONE APP</p>
          <h2 className="text-4xl font-black text-white mb-4">
            Full AI Autopilot or <span className="text-genius-green">Manual Control</span>
          </h2>
          <p className="text-genius-text mb-12 max-w-xl mx-auto">
            Not feeling the bot today? Switch it off instantly. GreenGeniusAI becomes a world-class research and portfolio management platform with the flip of a switch.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="genius-card rounded-2xl p-8 border border-genius-green/30">
              <div className="w-14 h-14 rounded-full bg-genius-green flex items-center justify-center mx-auto mb-4">
                <Brain size={28} className="text-genius-black" />
              </div>
              <h3 className="font-black text-white text-xl mb-2">BOT MODE</h3>
              <p className="text-genius-text text-sm leading-relaxed">Fully autonomous AI manages your portfolio 24/7. Buys, sells, rebalances — and tells you why every time. You just watch it grow.</p>
            </div>
            <div className="genius-card rounded-2xl p-8 border border-genius-border">
              <div className="w-14 h-14 rounded-full bg-genius-border flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} className="text-genius-muted" />
              </div>
              <h3 className="font-black text-white text-xl mb-2">INVESTOR MODE</h3>
              <p className="text-genius-text text-sm leading-relaxed">You take the wheel. Use GreenGeniusAI as your live market intelligence terminal. See what the AI recommends, then decide yourself.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-genius-green font-mono text-sm font-bold mb-3">PRICING</p>
          <h2 className="text-4xl font-black text-white mb-4">
            One Price. <span className="text-genius-green">Genius Included.</span>
          </h2>
          <p className="text-genius-text mb-12">
            Reserved for serious investors only. First 500 founding members lock in this rate forever.
          </p>

          <div className="genius-card rounded-3xl p-8 border border-genius-green/40 shadow-genius-strong relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-genius-green to-transparent" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="inline-block px-3 py-1 bg-genius-green/20 border border-genius-green/30 rounded-full text-genius-green text-xs font-bold">
                FOUNDING MEMBER RATE
              </div>
              <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-bold">
                LOCKS IN FOREVER
              </div>
            </div>
            <div className="mb-2">
              <span className="text-6xl font-black text-white">$14</span>
              <span className="text-3xl font-black text-genius-green">.99</span>
              <span className="text-genius-muted text-lg">/month</span>
            </div>
            <p className="text-xs text-genius-muted mb-6">Price goes up at 500 members. You lock in $14.99 permanently.</p>
            <div className="flex flex-col gap-3 mb-8 text-left">
              {PLANS[0].features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-genius-green flex-shrink-0" />
                  <span className="text-genius-text text-sm">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth?mode=signup"
              className="btn-genius w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2"
            >
              Claim Founding Access — 7 Days Free
              <ArrowUpRight size={18} />
            </Link>
            <p className="text-xs text-genius-muted mt-3">No credit card required for trial. Lock in $14.99 forever. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 bg-genius-card border-y border-genius-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">REVIEWS</p>
            <h2 className="text-4xl font-black text-white">Real Investors. Real Results.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="genius-card rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="text-genius-gold fill-genius-gold" />
                  ))}
                </div>
                <p className="text-genius-text text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-genius-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section id="trust" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-genius-green font-mono text-sm font-bold mb-3">SECURITY & TRUST</p>
            <h2 className="text-4xl font-black text-white mb-4">
              Your Money Is <span className="text-genius-green">Protected</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: "256-bit Encryption", desc: "All data encrypted in transit and at rest. Same standard as major banks." },
              { icon: Shield, title: "SIPC-Protected Accounts", desc: "Brokerage accounts protected up to $500,000 through our broker-dealer partner." },
              { icon: Globe, title: "Regulatory Compliant", desc: "Built on FINRA-licensed broker infrastructure. Full SEC compliance." },
              { icon: Eye, title: "Full Audit Trail", desc: "Every AI decision is logged, timestamped, and auditable. 100% transparency." },
            ].map((t, i) => (
              <div key={i} className="genius-card rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-genius-green/10 border border-genius-green/20 flex items-center justify-center mx-auto mb-4">
                  <t.icon size={22} className="text-genius-green" />
                </div>
                <h3 className="font-bold text-white mb-2">{t.title}</h3>
                <p className="text-xs text-genius-text leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-glow opacity-50" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            Ready to Invest<br />Like a <span className="text-genius-green glow-text">Genius?</span>
          </h2>
          <p className="text-genius-text text-lg mb-8">
            Only 500 founding member spots available. Lock in $14.99/month forever — price increases after that.
          </p>
          <Link
            href="/auth?mode=signup"
            className="btn-genius inline-flex items-center gap-2 px-10 py-5 rounded-xl text-lg font-black"
          >
            Claim Your Founding Rate — Free for 7 Days
            <ChevronRight size={22} />
          </Link>
          <p className="text-xs text-genius-muted mt-4">No credit card required. Cancel anytime before trial ends.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-genius-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-genius-green flex items-center justify-center">
                <Brain size={15} className="text-genius-black" />
              </div>
              <span className="font-black text-white">GreenGeniusAI</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-genius-muted">
              <a href="#" className="hover:text-genius-green transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-genius-green transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-genius-green transition-colors">Disclosures</a>
              <a href="#" className="hover:text-genius-green transition-colors">Contact</a>
            </div>
            <p className="text-xs text-genius-muted">© 2025 GreenGeniusAI. All rights reserved.</p>
          </div>
          <div className="mt-6 pt-6 border-t border-genius-border">
            <p className="text-xs text-genius-muted leading-relaxed">
              <AlertTriangle size={10} className="inline mr-1" />
              <strong>Disclosure:</strong> Investing involves risk, including possible loss of principal. GreenGeniusAI's AI engine provides data-driven trade recommendations and execution via licensed broker-dealer infrastructure. Past performance is not indicative of future results. GreenGeniusAI is not a registered investment advisor. Please read our full disclosures before investing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
