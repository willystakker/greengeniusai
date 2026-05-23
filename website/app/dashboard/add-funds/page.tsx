"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign, ArrowLeft, Zap, CheckCircle, TrendingUp, Brain, RefreshCw, ExternalLink,
} from "lucide-react";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";
import { runAutoTrade } from "@/lib/auto-trade";

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function AddFundsPage() {
  const router    = useRouter();
  const portfolio = useRealPortfolio(30000);

  const [amount,         setAmount]         = useState("");
  const [step,           setStep]           = useState<"amount" | "deploying" | "success">("amount");
  const [deployMsg,      setDeployMsg]      = useState("");
  const [tradesExecuted, setTradesExecuted] = useState(0);

  const balance    = portfolio.equity;
  const numAmount  = parseFloat(amount) || 0;

  const handleConfirm = async () => {
    if (numAmount < 10) return;
    setStep("deploying");
    setDeployMsg("AI is scanning markets and deploying your funds…");
    const result = await runAutoTrade();
    if (result.executed > 0) {
      setTradesExecuted(result.executed);
      setDeployMsg(`Deployed into ${result.executed} position${result.executed !== 1 ? "s" : ""}.`);
    } else {
      setDeployMsg("Bot will deploy on next signal above your confidence threshold.");
    }
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
          <h1 className="text-2xl font-black text-white">Add Funds</h1>
          <p className="text-xs text-genius-muted font-mono">Deposit to your Alpaca account — bot deploys automatically</p>
        </div>
      </div>

      {/* Current balance */}
      <div className="genius-card rounded-xl p-4 flex items-center justify-between border border-genius-green/20">
        <div>
          <p className="text-xs text-genius-muted font-mono mb-0.5">LIVE ALPACA BALANCE</p>
          <p className="text-2xl font-black text-genius-green font-mono">
            {portfolio.loading
              ? <RefreshCw size={20} className="animate-spin" />
              : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </p>
          <p className="text-xs text-genius-muted font-mono">
            {portfolio.connected ? "Connected · Live" : "Checking connection…"}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-genius-green/15 border border-genius-green/30 flex items-center justify-center">
          <Brain size={22} className="text-genius-green" />
        </div>
      </div>

      {step === "amount" && (
        <div className="flex flex-col gap-4">
          <div className="genius-card rounded-xl p-6 border border-genius-green/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-genius-green" />
              <h2 className="font-bold text-white">Alpaca Account Connected</h2>
            </div>
            <p className="text-xs text-genius-muted mb-6 leading-relaxed">
              Your live Alpaca account is connected. All deposits and withdrawals go directly through Alpaca — ACH transfers, wire transfers, and instant bank connections.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <a
                href="https://app.alpaca.markets/account/banking"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl btn-genius font-black text-sm"
              >
                <DollarSign size={15} /> Deposit Funds ↗
              </a>
              <a
                href="https://app.alpaca.markets/account/banking"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-genius-green/40 text-genius-green font-black text-sm hover:bg-genius-green/10 transition-colors"
              >
                <ExternalLink size={15} /> Withdraw ↗
              </a>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: "⚡", label: "Instant ACH",    desc: "Most deposits clear same-day or next morning." },
                { icon: "🏦", label: "Bank / Wire",     desc: "Connect your bank account directly in Alpaca." },
                { icon: "🤖", label: "AI Auto-Deploys", desc: "Once funds clear, the bot starts trading immediately." },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-genius-black border border-genius-border">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{c.label}</p>
                    <p className="text-xs text-genius-muted">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="genius-card rounded-xl p-4 border border-genius-border">
            <p className="text-xs text-genius-muted text-center">
              Manage all transactions at{" "}
              <a href="https://app.alpaca.markets" target="_blank" rel="noopener noreferrer"
                className="text-genius-green hover:underline font-semibold">
                app.alpaca.markets ↗
              </a>
            </p>
          </div>
        </div>
      )}

      {step === "deploying" && (
        <div className="genius-card rounded-xl p-10 text-center">
          <RefreshCw size={48} className="text-genius-green animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Deploying Funds</h2>
          <p className="text-genius-muted text-sm">{deployMsg}</p>
        </div>
      )}

      {step === "success" && (
        <div className="genius-card rounded-xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-genius-green/15 border-2 border-genius-green/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-genius-green" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Done!</h2>
          <p className="text-genius-muted mb-4 text-sm">{deployMsg}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep("amount"); setAmount(""); setTradesExecuted(0); }}
              className="flex-1 py-3 rounded-xl border border-genius-border text-genius-muted font-bold hover:text-white hover:border-genius-green/30 transition-colors text-sm"
            >
              Back
            </button>
            <Link href="/dashboard"
              className="flex-1 py-3 rounded-xl btn-genius font-black text-sm flex items-center justify-center gap-2">
              <TrendingUp size={14} /> View Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
