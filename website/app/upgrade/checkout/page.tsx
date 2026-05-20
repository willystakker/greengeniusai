"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, CheckCircle, Clock, Lock, Zap, ChevronRight, Tag } from "lucide-react";

const ELITE_FEATURES = [
  "Unlimited AI trades — no daily cap",
  "Dedicated AI model trained on your portfolio",
  "Custom trading strategies & backtesting",
  "All asset classes: stocks, crypto, ETFs, commodities",
  "White-glove priority support",
  "API access for custom integrations",
  "Advanced portfolio analytics",
  "Real-time risk monitoring & alerts",
];

function CheckoutContent() {
  const router     = useRouter();
  const params     = useSearchParams();
  const discount   = Number(params.get("discount") || 0);
  const code       = params.get("code") || "";
  const label      = params.get("label") || `${discount}% OFF`;

  const BASE_PRICE  = 49.99;
  const discounted  = discount === 100 ? 0 : +(BASE_PRICE * (1 - discount / 100)).toFixed(2);
  const savings     = +(BASE_PRICE - discounted).toFixed(2);

  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(15 * 60);

  // Load user info if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ggai_user");
      if (raw) {
        const u = JSON.parse(raw);
        setName(u.name || "");
        setEmail(u.email || "");
      }
    } catch {}
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const iv = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [countdown]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const expired = countdown <= 0;

  const handleCheckout = async () => {
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, plan: "elite", discountPct: discount, couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-genius-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-genius-green/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-2 gap-8">
        {/* Left: order summary */}
        <div className="flex flex-col gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={18} className="text-genius-black" />
            </div>
            <span className="font-black text-xl text-white">Green<span className="text-genius-green">Genius</span>AI</span>
          </div>

          {/* Timer */}
          {!expired ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 w-fit">
              <Clock size={14} className="text-yellow-400" />
              <span className="text-xs font-mono font-bold text-yellow-400">
                Offer expires in {mins}:{secs.toString().padStart(2,"0")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 w-fit">
              <Clock size={14} className="text-red-400" />
              <span className="text-xs font-mono font-bold text-red-400">Offer expired — spin again for a new discount</span>
            </div>
          )}

          {/* Plan card */}
          <div className="genius-card rounded-2xl p-6 border border-genius-green/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono bg-genius-green/20 text-genius-green border border-genius-green/30 px-2 py-0.5 rounded font-bold">ELITE PLAN</span>
                <h2 className="text-3xl font-black text-white mt-2">Upgrade to Elite</h2>
              </div>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-genius-muted line-through font-mono text-lg">${BASE_PRICE}/mo</p>
                )}
                {discount === 100 ? (
                  <div>
                    <p className="text-3xl font-black text-genius-green font-mono">FREE</p>
                    <p className="text-xs text-genius-muted font-mono">first month, then ${BASE_PRICE}/mo</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-black text-genius-green font-mono">${discounted}</p>
                    <p className="text-xs text-genius-muted font-mono">first month, then ${BASE_PRICE}/mo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon badge */}
            {code && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-genius-green/10 border border-genius-green/25 mb-4">
                <Tag size={13} className="text-genius-green" />
                <span className="text-xs text-genius-muted font-mono">Coupon applied:</span>
                <span className="text-xs font-black font-mono text-genius-green tracking-widest">{code}</span>
                <span className="ml-auto text-xs font-bold text-genius-green">−${savings} saved</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {ELITE_FEATURES.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <CheckCircle size={13} className="text-genius-green mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-genius-text">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-6">
            {[
              { icon: Lock,  text: "Stripe-secured checkout" },
              { icon: Zap,   text: "Instant activation" },
              { icon: CheckCircle, text: "Cancel anytime" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-1.5 text-xs text-genius-muted">
                <t.icon size={12} className="text-genius-green" />
                {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: checkout form */}
        <div className="genius-card rounded-2xl p-6 border border-genius-border h-fit">
          <h3 className="font-black text-white text-xl mb-5">Complete Your Upgrade</h3>

          <div className="flex flex-col gap-4 mb-5">
            <div>
              <label className="text-xs text-genius-muted font-mono mb-1.5 block">FULL NAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-genius-black border border-genius-border rounded-xl px-4 py-3 text-white text-sm placeholder-genius-muted/50 focus:outline-none focus:border-genius-green transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-genius-muted font-mono mb-1.5 block">EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-genius-black border border-genius-border rounded-xl px-4 py-3 text-white text-sm placeholder-genius-muted/50 focus:outline-none focus:border-genius-green transition-colors"
              />
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-genius-black rounded-xl p-4 border border-genius-border mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-genius-muted">Elite Plan (monthly)</span>
              <span className="text-white font-mono">${BASE_PRICE}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-genius-green flex items-center gap-1"><Tag size={11} /> {label} ({code})</span>
                <span className="text-genius-green font-mono font-bold">−${savings}</span>
              </div>
            )}
            <div className="border-t border-genius-border pt-2 mt-2 flex justify-between">
              <span className="font-bold text-white">Due today</span>
              <span className="font-black text-genius-green font-mono text-lg">
                {discount === 100 ? "$0.00" : `$${discounted}`}
              </span>
            </div>
            <p className="text-xs text-genius-muted font-mono mt-1">
              Then ${BASE_PRICE}/mo · Cancel anytime · No hidden fees
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || expired}
            className="w-full py-4 rounded-xl btn-genius font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-genius-black/30 border-t-genius-black rounded-full animate-spin" /> Processing...</>
            ) : (
              <><Lock size={16} /> Secure Checkout <ChevronRight size={16} /></>
            )}
          </button>

          <p className="text-xs text-genius-muted text-center mt-3">
            Redirects to Stripe · Encrypted · PCI compliant
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-genius-black flex items-center justify-center"><div className="text-genius-green font-mono">Loading...</div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
