"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brain, CheckCircle, Lock, Shield, Star, ArrowLeft, Zap } from "lucide-react";

const FEATURES = [
  "Full AI auto-trading engine (24/7)",
  "Live market data across stocks, ETFs & crypto",
  "Plain-English reasoning on every trade",
  "Bot on/off manual investor mode",
  "Risk profile customization",
  "Push + email alerts on every decision",
  "Portfolio analytics dashboard",
  "Cancel anytime — no contracts",
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Pre-fill from localStorage if user came through signup
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
        body: JSON.stringify({ email, name }),
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
        <Link href="/" className="flex items-center gap-1.5 text-genius-muted hover:text-genius-green transition-colors mb-8 text-sm">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — plan summary */}
          <div className="genius-card rounded-2xl p-8 border border-genius-green/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-genius-green flex items-center justify-center">
                <Brain size={20} className="text-genius-black" />
              </div>
              <div>
                <p className="font-black text-white text-lg">GreenGeniusAI</p>
                <p className="text-xs text-genius-muted">Genius Plan</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-black text-white">$8</span>
              <span className="text-3xl font-black text-genius-green">.99</span>
              <span className="text-genius-muted">/month</span>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-genius-green/10 border border-genius-green/30 rounded-full">
                <Zap size={12} className="text-genius-green" />
                <span className="text-xs font-bold text-genius-green">7-DAY FREE TRIAL</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mb-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-genius-green flex-shrink-0" />
                  <span className="text-sm text-genius-text">{f}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="pt-6 border-t border-genius-border">
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
              7 days free, then $8.99/month. Cancel anytime before trial ends and you won't be charged.
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
                  "Start Free Trial — $8.99/mo after →"
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
