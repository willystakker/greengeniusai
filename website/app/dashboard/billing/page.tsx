"use client";

import { useState } from "react";
import {
  CreditCard, Download, CheckCircle, AlertTriangle,
  ChevronRight, RefreshCw, Shield, Zap, ExternalLink,
} from "lucide-react";
import Link from "next/link";

const INVOICES = [
  { id: "INV-0005", date: "May 18, 2026",  amount: 29.99, status: "paid",    plan: "Genius" },
  { id: "INV-0004", date: "Apr 18, 2026",  amount: 29.99, status: "paid",    plan: "Genius" },
  { id: "INV-0003", date: "Mar 18, 2026",  amount: 29.99, status: "paid",    plan: "Genius" },
  { id: "INV-0002", date: "Feb 18, 2026",  amount: 14.99, status: "paid",    plan: "Founding" },
  { id: "INV-0001", date: "Jan 18, 2026",  amount: 0.00,  status: "trial",   plan: "Trial" },
];

export default function BillingPage() {
  const [plan,        setPlan]        = useState("genius");
  const [cancelModal, setCancelModal] = useState(false);
  const [updating,    setUpdating]    = useState(false);

  const BASE_PRICE = plan === "analyst" ? 10 : plan === "genius" ? 29.99 : 49.99;
  const PLAN_LABEL = plan === "analyst" ? "Analyst" : plan === "genius" ? "Genius" : "Elite";

  const handleUpdatePayment = () => {
    setUpdating(true);
    setTimeout(() => setUpdating(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Billing & Subscription</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5">Manage your plan, payment method, and invoices</p>
        </div>
        <Link
          href="/upgrade"
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold"
        >
          <Zap size={14} /> Upgrade to Elite
        </Link>
      </div>

      {/* Current plan */}
      <div className="genius-card rounded-2xl p-6 border border-genius-green/25 bg-genius-green/3">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono bg-genius-green/20 text-genius-green border border-genius-green/30 px-2 py-0.5 rounded-full font-bold">● ACTIVE</span>
              <span className="text-xs text-genius-muted font-mono">Founding Member</span>
            </div>
            <h2 className="text-3xl font-black text-white">{PLAN_LABEL} Plan</h2>
            <p className="text-genius-green font-mono font-bold text-xl mt-1">${BASE_PRICE}/month</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-genius-muted font-mono">Next billing date</p>
            <p className="text-lg font-bold text-white">June 18, 2026</p>
            <p className="text-xs text-genius-muted font-mono mt-0.5">7-day trial active — no charge yet</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "AI Trades Used",   value: 47,  max: "∞",   pct: 47 },
            { label: "API Calls",        value: 312, max: 5000,  pct: 6 },
            { label: "Alerts Active",    value: 6,   max: "∞",   pct: 60 },
          ].map(u => (
            <div key={u.label} className="bg-genius-black rounded-xl p-3 border border-genius-border">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-genius-muted font-mono">{u.label}</span>
                <span className="text-white font-mono font-bold">{u.value}<span className="text-genius-muted">/{u.max}</span></span>
              </div>
              <div className="w-full h-1.5 bg-genius-border rounded-full">
                <div className="h-full bg-genius-green rounded-full transition-all" style={{width:`${Math.min(u.pct,100)}%`}} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdatePayment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-genius-border text-genius-muted hover:text-white hover:border-genius-green text-sm font-semibold transition-all"
          >
            <RefreshCw size={13} className={updating ? "animate-spin" : ""} />
            {updating ? "Redirecting..." : "Update Payment Method"}
          </button>
          <Link
            href="/upgrade"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-genius text-sm font-bold"
          >
            <Zap size={13} /> Upgrade to Elite
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Payment method */}
        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Payment Method</h2>
          <div className="flex items-center gap-4 p-4 bg-genius-black rounded-xl border border-genius-border mb-4">
            <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Visa ending in ••••</p>
              <p className="text-xs text-genius-muted font-mono">Expires 08/28</p>
            </div>
            <span className="text-xs font-mono bg-genius-green/10 text-genius-green border border-genius-green/20 px-2 py-0.5 rounded">Default</span>
          </div>
          <button
            onClick={handleUpdatePayment}
            className="w-full py-2.5 rounded-xl border border-genius-border text-genius-muted hover:text-white hover:border-genius-green transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <CreditCard size={14} /> Update Card
          </button>
          <div className="flex items-center gap-2 mt-3 text-xs text-genius-muted">
            <Shield size={11} className="text-genius-green" />
            Payments secured by Stripe · PCI DSS compliant
          </div>
        </div>

        {/* Plan comparison */}
        <div className="genius-card rounded-xl p-5">
          <h2 className="font-bold text-white mb-4">Upgrade Benefits</h2>
          <div className="flex flex-col gap-2">
            {[
              { feat: "Unlimited AI trades",           genius: true,  elite: true },
              { feat: "Custom AI strategies",           genius: false, elite: true },
              { feat: "White-glove support",            genius: false, elite: true },
              { feat: "API access",                     genius: false, elite: true },
              { feat: "Dedicated AI model",             genius: false, elite: true },
              { feat: "Advanced backtesting",           genius: false, elite: true },
            ].map(r => (
              <div key={r.feat} className="flex items-center justify-between text-sm py-1.5 border-b border-genius-border/40 last:border-0">
                <span className="text-genius-text">{r.feat}</span>
                <div className="flex gap-8">
                  <span className={r.genius ? "text-genius-green" : "text-genius-muted/40"}>{r.genius ? "✓" : "—"}</span>
                  <span className="text-genius-green font-bold">✓</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-6 mt-2">
            <span className="text-xs text-genius-muted font-mono">Genius</span>
            <span className="text-xs text-genius-green font-mono font-bold">Elite</span>
          </div>
          <Link
            href="/upgrade"
            className="mt-3 w-full py-2.5 rounded-xl btn-genius text-sm font-bold flex items-center justify-center gap-2"
          >
            <Zap size={13} /> Spin for a Discount →
          </Link>
        </div>
      </div>

      {/* Invoice history */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-genius-border flex items-center justify-between">
          <h2 className="font-bold text-white">Invoice History</h2>
          <button className="flex items-center gap-2 text-sm text-genius-muted hover:text-white transition-colors font-semibold">
            <Download size={13} /> Download All
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-genius-border bg-genius-dark">
              {["Invoice","Date","Plan","Amount","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-genius-muted font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                <td className="px-4 py-3 font-mono text-genius-green text-sm font-bold">{inv.id}</td>
                <td className="px-4 py-3 text-genius-text">{inv.date}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-genius-border text-genius-muted px-2 py-0.5 rounded">{inv.plan}</span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-white">
                  {inv.amount === 0 ? <span className="text-genius-green">FREE TRIAL</span> : `$${inv.amount.toFixed(2)}`}
                </td>
                <td className="px-4 py-3">
                  {inv.status === "paid" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-genius-green">
                      <CheckCircle size={11} /> Paid
                    </span>
                  ) : inv.status === "trial" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-genius-muted">
                      <CheckCircle size={11} /> Trial
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-red-400">
                      <AlertTriangle size={11} /> Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 text-xs text-genius-muted hover:text-genius-green transition-colors">
                    <Download size={11} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Danger zone */}
      <div className="genius-card rounded-xl p-5 border border-red-500/15">
        <h3 className="font-bold text-white mb-1">Cancel Subscription</h3>
        <p className="text-xs text-genius-muted mb-4">
          You'll keep access until June 18, 2026. Your AI bot will stop trading and your data will be retained for 90 days.
        </p>
        <button
          onClick={() => setCancelModal(true)}
          className="px-5 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/5 transition-colors flex items-center gap-2"
        >
          Cancel Subscription <ChevronRight size={13} />
        </button>
      </div>

      {/* Cancel confirmation modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="genius-card rounded-2xl p-6 max-w-md w-full border border-red-500/30">
            <h3 className="font-black text-white text-lg mb-2">Cancel subscription?</h3>
            <p className="text-sm text-genius-text mb-5">
              Your AI bot will stop trading immediately. You'll keep access through June 18, 2026. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-genius-border text-genius-muted hover:text-white transition-all text-sm font-semibold"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => setCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
