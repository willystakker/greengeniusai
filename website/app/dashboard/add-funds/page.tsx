"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign, ArrowLeft, CreditCard, Building2, Zap, Lock,
  CheckCircle, AlertTriangle, ChevronRight, RefreshCw,
  TrendingUp, Link2, ExternalLink, Info,
} from "lucide-react";

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

const METHODS = [
  {
    id:    "ach",
    icon:  Building2,
    label: "Bank Transfer (ACH)",
    sub:   "Free · 2–5 business days",
    badge: "Most Popular",
    color: "border-genius-green/40 bg-genius-green/5",
  },
  {
    id:    "wire",
    icon:  Building2,
    label: "Wire Transfer",
    sub:   "$15–$25 fee · Same day",
    badge: null,
    color: "border-genius-border",
  },
  {
    id:    "card",
    icon:  CreditCard,
    label: "Debit Card",
    sub:   "1.5% fee · Instant",
    badge: "Instant",
    color: "border-genius-border",
  },
];

export default function AddFundsPage() {
  const router = useRouter();
  const [amount,       setAmount]       = useState("");
  const [method,       setMethod]       = useState("ach");
  const [step,         setStep]         = useState<"amount"|"confirm"|"success">("amount");
  const [processing,   setProcessing]   = useState(false);
  const [brokerLinked, setBrokerLinked] = useState(false);
  const [alpacaPaper,  setAlpacaPaper]  = useState(true);

  useEffect(() => {
    const key    = localStorage.getItem("ggai_alpaca_key")    ?? "";
    const secret = localStorage.getItem("ggai_alpaca_secret") ?? "";
    const paper  = localStorage.getItem("ggai_alpaca_paper") !== "false";
    setBrokerLinked(key.length > 4 && secret.length > 4);
    setAlpacaPaper(paper);
  }, []);

  const numAmount  = parseFloat(amount) || 0;
  const selectedM  = METHODS.find(m => m.id === method)!;
  const fee        = method === "wire" ? 20 : method === "card" ? +(numAmount * 0.015).toFixed(2) : 0;
  const total      = +(numAmount + fee).toFixed(2);

  const handleContinue = () => {
    if (numAmount < 10) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setProcessing(false);
    setStep("success");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step === "amount" ? router.back() : setStep("amount")}
          className="p-2 rounded-lg border border-genius-border text-genius-muted hover:text-white hover:border-genius-green/40 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Add Funds</h1>
          <p className="text-xs text-genius-muted font-mono">Deposit to your {alpacaPaper ? "paper trading" : "live"} account</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${brokerLinked ? "bg-genius-green animate-pulse" : "bg-yellow-400"}`} />
          <span className={`text-xs font-mono font-bold ${brokerLinked ? "text-genius-green" : "text-yellow-400"}`}>
            {brokerLinked ? "Broker Connected" : "No Broker Linked"}
          </span>
        </div>
      </div>

      {/* Broker not connected banner */}
      {!brokerLinked && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-400/8 border border-yellow-400/30">
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-yellow-300 mb-0.5">Connect your broker first</p>
            <p className="text-xs text-genius-muted mb-3">
              To deposit and trade real money, you need to link your Alpaca brokerage account. It takes 2 minutes and is completely free.
            </p>
            <Link
              href="/dashboard/settings?section=broker"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-sm font-bold hover:bg-yellow-400/25 transition-colors"
            >
              <Link2 size={13} /> Connect Broker in Settings <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {step === "amount" && (
        <>
          {/* Amount input */}
          <div className="genius-card rounded-xl p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-genius-green" /> Enter Amount
            </h2>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-genius-green">$</span>
              <input
                type="number"
                min={10}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-genius-black border border-genius-border rounded-xl pl-10 pr-4 py-4 text-3xl font-black text-white font-mono focus:outline-none focus:border-genius-green transition-colors"
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    numAmount === q
                      ? "border-genius-green bg-genius-green/15 text-genius-green"
                      : "border-genius-border text-genius-muted hover:text-white hover:border-genius-green/30"
                  }`}
                >
                  ${q >= 1000 ? `${q/1000}k` : q}
                </button>
              ))}
            </div>
            {numAmount > 0 && numAmount < 10 && (
              <p className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1">
                <AlertTriangle size={10} /> Minimum deposit is $10
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="genius-card rounded-xl p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-genius-green" /> Payment Method
            </h2>
            <div className="flex flex-col gap-2">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    method === m.id ? m.color + " border-genius-green/50" : "border-genius-border hover:border-genius-green/25"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    method === m.id ? "bg-genius-green/20" : "bg-genius-black"
                  }`}>
                    <m.icon size={18} className={method === m.id ? "text-genius-green" : "text-genius-muted"} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${method === m.id ? "text-white" : "text-genius-muted"}`}>{m.label}</span>
                      {m.badge && (
                        <span className="text-xs font-mono font-black px-1.5 py-0.5 rounded bg-genius-green/20 text-genius-green border border-genius-green/30">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-genius-muted mt-0.5">{m.sub}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    method === m.id ? "border-genius-green" : "border-genius-border"
                  }`}>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-genius-green" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary + CTA */}
          {numAmount >= 10 && (
            <div className="genius-card rounded-xl p-5 border border-genius-green/20">
              <div className="flex flex-col gap-2 mb-4">
                {[
                  { label: "Deposit amount", value: `$${numAmount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` },
                  ...(fee > 0 ? [{ label: `${selectedM.label} fee`, value: `$${fee.toFixed(2)}` }] : []),
                  { label: "You will receive", value: `$${numAmount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, bold: true },
                ].map((r: any) => (
                  <div key={r.label} className={`flex justify-between text-sm ${r.bold ? "border-t border-genius-border pt-2 mt-1" : ""}`}>
                    <span className="text-genius-muted">{r.label}</span>
                    <span className={r.bold ? "text-genius-green font-black text-base" : "text-white font-semibold"}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleContinue}
                disabled={!brokerLinked}
                className="w-full py-3.5 rounded-xl btn-genius font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={16} /> Continue
              </button>
              {!brokerLinked && (
                <p className="text-xs text-center text-genius-muted mt-2">Connect your broker above to proceed</p>
              )}
            </div>
          )}
        </>
      )}

      {step === "confirm" && (
        <div className="genius-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-genius-green/15 border border-genius-green/30 flex items-center justify-center mx-auto mb-5">
            <DollarSign size={28} className="text-genius-green" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Confirm Deposit</h2>
          <p className="text-genius-muted text-sm mb-6">Review your deposit details before confirming.</p>

          <div className="bg-genius-black rounded-xl p-5 text-left mb-6 border border-genius-border">
            {[
              { label: "Amount",         value: `$${numAmount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` },
              { label: "Method",         value: selectedM.label },
              { label: "Fee",            value: fee > 0 ? `$${fee.toFixed(2)}` : "Free" },
              { label: "Total charged",  value: `$${total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}` },
              { label: "Destination",    value: alpacaPaper ? "Paper Trading Account" : "Live Trading Account" },
              { label: "Available in",   value: method === "ach" ? "2–5 business days" : method === "wire" ? "Same day" : "Instantly" },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2 border-b border-genius-border/50 last:border-0 text-sm">
                <span className="text-genius-muted">{r.label}</span>
                <span className="text-white font-semibold">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-genius-green/5 border border-genius-green/20 mb-6 text-left">
            <Lock size={12} className="text-genius-green mt-0.5 flex-shrink-0" />
            <p className="text-xs text-genius-muted">Your funds will be deposited securely via Alpaca's regulated brokerage infrastructure. Protected by SIPC up to $500,000.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("amount")}
              className="flex-1 py-3 rounded-xl border border-genius-border text-genius-muted font-bold hover:text-white hover:border-genius-green/30 transition-colors text-sm">
              Back
            </button>
            <button onClick={handleConfirm} disabled={processing}
              className="flex-1 py-3 rounded-xl btn-genius font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {processing
                ? <><RefreshCw size={14} className="animate-spin" /> Processing...</>
                : <><CheckCircle size={14} /> Confirm Deposit</>
              }
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="genius-card rounded-xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-genius-green/15 border-2 border-genius-green/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-genius-green" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Deposit Initiated!</h2>
          <p className="text-genius-muted mb-1">
            <span className="text-genius-green font-black text-xl">${numAmount.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span> is on its way to your account.
          </p>
          <p className="text-xs text-genius-muted font-mono mb-8">
            {method === "ach" ? "Funds available in 2–5 business days." : method === "wire" ? "Same-day arrival expected." : "Funds available instantly."}
          </p>

          {/* What happens next */}
          <div className="text-left bg-genius-black rounded-xl p-5 border border-genius-border mb-8">
            <p className="text-xs text-genius-muted font-mono mb-4">WHAT HAPPENS NEXT</p>
            <div className="flex flex-col gap-4">
              {[
                { icon: CheckCircle,  color: "text-genius-green", title: "Deposit requested",                   sub: "Your transfer has been initiated" },
                { icon: RefreshCw,    color: "text-genius-muted", title: "Funds clear",                         sub: method === "card" ? "Instant" : method === "wire" ? "Same day" : "2–5 business days" },
                { icon: TrendingUp,   color: "text-genius-muted", title: "AI bot starts investing",              sub: "Auto-deployed into highest-confidence signals" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${i === 0 ? "border-genius-green/40 bg-genius-green/10" : "border-genius-border"}`}>
                    <s.icon size={13} className={s.color} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${i === 0 ? "text-white" : "text-genius-muted"}`}>{s.title}</p>
                    <p className="text-xs text-genius-muted">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep("amount"); setAmount(""); }}
              className="flex-1 py-3 rounded-xl border border-genius-border text-genius-muted font-bold hover:text-white hover:border-genius-green/30 transition-colors text-sm">
              Add More Funds
            </button>
            <Link href="/dashboard"
              className="flex-1 py-3 rounded-xl btn-genius font-black text-sm flex items-center justify-center gap-2">
              <TrendingUp size={14} /> Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* How deposits work */}
      {step === "amount" && (
        <div className="genius-card rounded-xl p-5 border border-genius-border">
          <div className="flex items-center gap-2 mb-3">
            <Info size={13} className="text-genius-green" />
            <h3 className="text-sm font-bold text-white">How deposits work</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-genius-muted">
            {[
              { icon: "🏦", title: "Held at Alpaca", sub: "Your funds are held securely at Alpaca Markets, a FINRA-regulated broker." },
              { icon: "🛡️", title: "SIPC Protected", sub: "Cash and securities protected up to $500,000 by SIPC insurance." },
              { icon: "🤖", title: "AI Deploys It",  sub: "Once cleared, the bot automatically invests based on your signal settings." },
            ].map(c => (
              <div key={c.title}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="font-bold text-genius-text mb-1">{c.title}</p>
                <p>{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
