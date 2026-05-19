"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brain, CheckCircle, Lock, Shield, Star, ArrowLeft, Zap, Crown } from "lucide-react";

const PLANS = {
  analyst: {
    name: "Analyst",
    price: "$10",
    priceFull: "10.00",
    badge: null,
    features: [
      "AI market analysis & recommendations",
      "Plain-English trade reasoning",
      "Live market data & watchlist",
      "Up to 10 monitored assets",
      "Email alerts on signals",
      "Manual execution — you place trades",
      "Portfolio performance tracker",
      "Cancel anytime — no contracts",
    ],
  },
  genius: {
    name: "Genius",
    price: "$29",
    cents: ".99",
    priceFull: "29.99",
    badge: "Most Popular",
    features: [
      "Full AI auto-investing bot (24/7)",
      "Stocks + ETFs automated trading",
      "Bot on/off manual override",
      "Risk profile customization",
      "Push + email alerts on every trade",
      "Portfolio analytics dashboard",
      "Unlimited monitored assets",
      "Cancel anytime — no contracts",
    ],
  },
  elite: {
    name: "Elite",
    price: "$49",
    cents: ".99",
    priceFull: "49.99",
    badge: "Most Powerful",
    features: [
      "Everything in Genius",
      "Crypto trading (BTC, ETH, SOL + more)",
      "Multi-portfolio management",
      "Options flow & dark pool signals",
      "Priority trade execution",
      "Weekly AI market briefing",
      "Early access to new features",
      "VIP priority support",
    ],
  },
} as const;

type PlanKey = keyof typeof PLANS;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const planParam = (searchParams.get("plan") ?? "genius") as PlanKey;
  const plan = PLANS[planParam] ?? PLANS.genius;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("ggai_user") : null;
    if (raw) {
      const u = JSON.parse(raw);
      setEmail(u.email || "");
      setName(u.name || "");
    }
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, plan: planParam }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-genius-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Link href="/#pricing" className="flex items-center gap-1.5 text-genius-muted hover:text-genius-green transition-colors mb-8 text-sm">
          <ArrowLeft size={14} /> Back to plans
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — plan summary */}
          <div className="genius-card rounded-2xl p-8 border border-genius-green/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-genius-green flex items-center justify-center">
                {planParam === "elite" ? (
                  <Crown size={20} className="text-genius-black" />
                ) : (
                  <Brain size={20} className="text-genius-black" />
                )}
              </div>
              <div>
                <p className="font-black text-white text-lg">GreenGeniusAI</p>
                <p className="text-xs text-genius-muted">{plan.name} Plan</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-black text-white">{plan.price}</span>
              {"cents" in plan && (
                <span className="text-3xl font-black text-genius-green">{plan.cents}</span>
              )}
              <span className="text-genius-muted">/month</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-genius-green/10 border border-genius-green/30 rounded-full">
                  <Zap size={12} className="text-genius-green" />
                  <span className="text-xs font-bold text-genius-green">7-DAY FREE TRIAL</span>
                </div>
                {plan.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-xs font-bold text-genius-muted">{plan.badge.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mb-6">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-genius-green flex-shrink-0" />
                  <span className="text-sm text-genius-text">{f}</span>
                </div>
              ))}
            </div>

            {/* Plan switcher */}
            <div className="pt-4 border-t border-genius-border">
              <p className="text-xs text-genius-muted mb-2">Switch plan:</p>
              <div className="flex gap-2">
                {(Object.keys(PLANS) as PlanKey[]).map((key) => (
                  <Link
                    key={key}
                    href={`/checkout?plan=${key}`}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${
                      key === planParam
                        ? "bg-genius-green text-genius-black"
                        : "border border-genius-border text-genius-muted hover:border-genius-green hover:text-genius-green"
                    }`}
                  >
                    {PLANS[key].name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div className="pt-4 border-t border-genius-border mt-4">
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                <span className="text-xs text-genius-muted ml-2">4.9/5 · 1,200+ reviews</span>
              </div>
              <p className="text-xs text-genius-muted italic">"Made back the subscription in the first week."</p>
            </div>
          </div>

          {/* Right — checkout form */}
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Start Your Free Trial</h1>
            <p className="text-genius-muted text-sm mb-6">
              7 days free, then {"cents" in plan ? `${plan.price}${plan.cents}` : plan.price}/month. Cancel anytime before trial ends and you won't be charged.
            </p>

            {cancelled && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-xs text-yellow-400">
                No worries — your trial is still waiting. Complete checkout when you're ready.
              </div>
            )}

            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-genius-muted font-mono block mb-1.5">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jaden Green"
                  required
                  className="w-full bg-genius-card border border-genius-border rounded-xl px-4 py-3 text-white placeholder-genius-muted focus:outline-none focus:border-genius-green transition-colors text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-genius-muted font-mono block mb-1.5">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-genius-card border border-genius-border rounded-xl px-4 py-3 text-white placeholder-genius-muted focus:outline-none focus:border-genius-green transition-colors text-sm"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-genius w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="animate-pulse">Redirecting to secure checkout...</span>
                ) : (
                  `Start Free Trial — ${"cents" in plan ? `${plan.price}${plan.cents}` : plan.price}/mo after →`
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-genius-muted mt-1">
                <span className="flex items-center gap-1"><Lock size={10} className="text-genius-green" /> Secure checkout</span>
                <span className="flex items-center gap-1"><Shield size={10} className="text-genius-green" /> No charge during trial</span>
              </div>
            </form>

            <p className="text-xs text-genius-muted mt-6 leading-relaxed text-center">
              By starting your trial you agree to our Terms of Service and Privacy Policy.
              You can cancel anytime from your account settings. Investing involves risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-genius-black flex items-center justify-center">
        <div className="text-genius-green font-mono animate-pulse">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
