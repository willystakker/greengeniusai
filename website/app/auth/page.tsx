"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, Eye, EyeOff, CheckCircle, ArrowLeft,
  Lock, Shield, RefreshCw
} from "lucide-react";
import { saveUser } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Step 1 → Step 2 for signup
    if (mode === "signup" && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password, riskProfile }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }

      saveUser(data.user);

      // New users go to checkout to start trial. Returning users go to dashboard.
      if (mode === "signup") {
        router.push("/checkout");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-genius-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-genius-dark border-r border-genius-border flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(rgba(0,255,65,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-genius-green flex items-center justify-center">
              <Brain size={18} className="text-genius-black" />
            </div>
            <span className="font-black text-xl text-white">Green<span className="text-genius-green">Genius</span>AI</span>
          </Link>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-genius-border bg-genius-card mb-6">
            <div className="live-dot" />
            <span className="text-xs font-mono text-genius-green font-bold">AI CURRENTLY ACTIVE</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">Your AI investor<br />never sleeps.</h2>
          <p className="text-genius-text leading-relaxed mb-8">
            While you sleep, work, or live your life — GreenGeniusAI is scanning 10,000+ assets, identifying opportunities, and protecting your capital.
          </p>
          <div className="flex flex-col gap-3">
            {["7-day free trial, no credit card needed", "Cancel anytime in one click", "Full trade transparency — know every decision", "SIPC-insured brokerage accounts"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle size={14} className="text-genius-green flex-shrink-0" />
                <span className="text-sm text-genius-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-genius-muted">© 2025 GreenGeniusAI · Built on FINRA-licensed infrastructure</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-1.5 text-genius-muted hover:text-genius-green transition-colors mb-8 text-sm">
            <ArrowLeft size={14} /> Back to home
          </Link>

          {/* Toggle */}
          <div className="flex rounded-xl border border-genius-border bg-genius-card p-1 mb-8">
            {(["signup", "signin"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === m ? "bg-genius-green text-genius-black" : "text-genius-muted hover:text-white"}`}>
                {m === "signup" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? "bg-genius-green" : "bg-genius-border"}`} />
              ))}
            </div>
          )}

          <h1 className="text-2xl font-black text-white mb-2">
            {mode === "signup" ? (step === 1 ? "Create your account" : "Set your risk profile") : "Welcome back"}
          </h1>
          <p className="text-sm text-genius-muted mb-8">
            {mode === "signup" ? (step === 1 ? "Start your 7-day free trial. No credit card required." : "Tell the AI how aggressive you want it to be.") : "Sign in to your GreenGeniusAI dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {(mode === "signin" || step === 1) && (
              <>
                {mode === "signup" && (
                  <div>
                    <label className="text-xs text-genius-muted font-mono block mb-1.5">FULL NAME</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jaden Green" required
                      className="w-full bg-genius-card border border-genius-border rounded-xl px-4 py-3 text-white placeholder-genius-muted focus:outline-none focus:border-genius-green transition-colors text-sm" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-genius-muted font-mono block mb-1.5">EMAIL ADDRESS</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full bg-genius-card border border-genius-border rounded-xl px-4 py-3 text-white placeholder-genius-muted focus:outline-none focus:border-genius-green transition-colors text-sm" />
                </div>
                <div>
                  <label className="text-xs text-genius-muted font-mono block mb-1.5">PASSWORD</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      className="w-full bg-genius-card border border-genius-border rounded-xl px-4 py-3 text-white placeholder-genius-muted focus:outline-none focus:border-genius-green transition-colors text-sm pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-genius-muted hover:text-genius-green">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && step === 2 && (
              <div className="flex flex-col gap-3">
                {(["conservative", "moderate", "aggressive"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRiskProfile(r)}
                    className={`p-4 rounded-xl border text-left transition-all ${riskProfile === r ? "border-genius-green bg-genius-green/10" : "border-genius-border hover:border-genius-green/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white capitalize">{r}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${riskProfile === r ? "border-genius-green" : "border-genius-border"}`}>
                        {riskProfile === r && <div className="w-2 h-2 rounded-full bg-genius-green" />}
                      </div>
                    </div>
                    <p className="text-xs text-genius-muted">
                      {r === "conservative" ? "Capital preservation first. Lower volatility, steadier gains." :
                       r === "moderate" ? "Balanced growth and stability. Most popular choice." :
                       "Max growth focus. Higher ceiling, higher risk. For experienced investors."}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="btn-genius w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {loading ? (
                <><RefreshCw size={16} className="animate-spin" /> Please wait...</>
              ) : mode === "signup" ? (
                step === 1 ? "Continue →" : "Launch My AI →"
              ) : "Sign In →"}
            </button>
          </form>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-px bg-genius-border" />
            <span className="text-xs text-genius-muted">or</span>
            <div className="flex-1 h-px bg-genius-border" />
          </div>

          <button className="mt-4 w-full py-3 rounded-xl border border-genius-border text-genius-text hover:border-genius-green transition-colors text-sm font-semibold flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 flex items-center gap-4 text-xs text-genius-muted">
            <Lock size={11} className="text-genius-green" /> End-to-end encrypted
            <Shield size={11} className="text-genius-green" /> SOC 2 compliant
          </div>
        </div>
      </div>
    </div>
  );
}
