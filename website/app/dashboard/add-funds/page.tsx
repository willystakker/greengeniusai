"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign, ArrowLeft, Zap, CheckCircle, TrendingUp, Brain,
} from "lucide-react";
import { addVirtualFunds, loadPaperPortfolio } from "@/lib/paper-trading";

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function AddFundsPage() {
  const router = useRouter();
  const [amount,     setAmount]     = useState("");
  const [step,       setStep]       = useState<"amount" | "success">("amount");
  const [balance,    setBalance]    = useState(0);
  const [deposited,  setDeposited]  = useState(0);

  useEffect(() => {
    const p = loadPaperPortfolio();
    setBalance(p.cash);
    setDeposited(p.deposited);
  }, []);

  const numAmount = parseFloat(amount) || 0;

  const handleConfirm = () => {
    if (numAmount < 10) return;
    const updated = addVirtualFunds(numAmount);
    setBalance(updated.cash);
    setDeposited(updated.deposited);
    setStep("success");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => step === "amount" ? router.back() : setStep("amount")}
          className="p-2 rounded-lg border border-genius-border text-genius-muted hover:text-white hover:border-genius-green/40 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Add Virtual Funds</h1>
          <p className="text-xs text-genius-muted font-mono">
            Fund your paper trading account — no real money, full experience
          </p>
        </div>
      </div>

      {/* Current balance */}
      <div className="genius-card rounded-xl p-4 flex items-center justify-between border border-genius-green/20">
        <div>
          <p className="text-xs text-genius-muted font-mono mb-0.5">CURRENT PAPER BALANCE</p>
          <p className="text-2xl font-black text-genius-green font-mono">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-genius-muted font-mono">
            ${deposited.toLocaleString("en-US", { minimumFractionDigits: 2 })} total deposited
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-genius-green/15 border border-genius-green/30 flex items-center justify-center">
          <Brain size={22} className="text-genius-green" />
        </div>
      </div>

      {step === "amount" && (
        <>
          {/* Amount input */}
          <div className="genius-card rounded-xl p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-genius-green" /> Choose Amount
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

            <div className="grid grid-cols-3 gap-2 mb-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`py-2.5 rounded-xl border text-sm font-bold font-mono transition-all ${
                    numAmount === q
                      ? "border-genius-green bg-genius-green/15 text-genius-green"
                      : "border-genius-border text-genius-muted hover:text-white hover:border-genius-green/30"
                  }`}
                >
                  ${q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>

            {numAmount > 0 && numAmount < 10 && (
              <p className="text-xs text-red-400 font-mono mt-2">Minimum deposit is $10</p>
            )}
          </div>

          {/* CTA */}
          {numAmount >= 10 && (
            <div className="genius-card rounded-xl p-5 border border-genius-green/20">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-genius-muted">Adding to paper account</span>
                <span className="text-genius-green font-black text-base font-mono">
                  ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 rounded-xl btn-genius font-black text-base flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Add ${numAmount.toLocaleString()} to Account
              </button>
            </div>
          )}

          {/* Info strip */}
          <div className="genius-card rounded-xl p-5 border border-genius-border">
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-genius-muted">
              {[
                { icon: "🎮", title: "Paper Trading", sub: "Virtual money, real market prices. Zero risk to your wallet." },
                { icon: "⚡", title: "Instant",       sub: "Funds available immediately — the AI bot starts trading right away." },
                { icon: "🤖", title: "AI Deploys It", sub: "The bot auto-invests based on your confidence settings." },
              ].map(c => (
                <div key={c.title}>
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <p className="font-bold text-genius-text mb-1">{c.title}</p>
                  <p>{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === "success" && (
        <div className="genius-card rounded-xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-genius-green/15 border-2 border-genius-green/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-genius-green" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Funds Added!</h2>
          <p className="text-genius-muted mb-1">
            <span className="text-genius-green font-black text-xl">
              ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>{" "}
            added to your paper account instantly.
          </p>
          <p className="text-xs text-genius-muted font-mono mb-2">
            New balance:{" "}
            <span className="text-genius-green font-bold">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-xs text-genius-muted font-mono mb-8">
            The AI bot will start investing your virtual funds immediately.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("amount"); setAmount(""); }}
              className="flex-1 py-3 rounded-xl border border-genius-border text-genius-muted font-bold hover:text-white hover:border-genius-green/30 transition-colors text-sm"
            >
              Add More
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl btn-genius font-black text-sm flex items-center justify-center gap-2"
            >
              <TrendingUp size={14} /> View Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
