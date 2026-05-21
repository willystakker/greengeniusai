"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Shield, Clock, BarChart2,
  X, ChevronDown, AlertTriangle,
} from "lucide-react";
import { useTickerChart } from "@/components/TickerChartProvider";

// ─── Colors ───────────────────────────────────────────────────────────────────
const P  = "#A855F7";   // purple primary
const PA = "#7C3AED";   // purple alt / dark
const PG = "#C084FC";   // purple glow / light

// ─── Data ─────────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: "Open Positions",        value: "3",       sub: "active contracts",          icon: BarChart2  },
  { label: "Total Premium Collected", value: "$4,847", sub: "net credit received",      icon: TrendingUp },
  { label: "Win Rate",              value: "71.2%",    sub: "last 312 trades",           icon: Shield     },
  { label: "Max Drawdown",          value: "-5.4%",    sub: "peak-to-trough",            icon: AlertTriangle },
];

const POSITIONS = [
  { contract: "NVDA 900C 05/17", type: "CALL", strike: "$900", expiry: "May 17", premium: "$12.40", delta: "Δ 0.48",  pnl: "+$284", pnlNum: 284,  status: "OPEN"   },
  { contract: "AAPL 180P 05/10", type: "PUT",  strike: "$180", expiry: "May 10", premium: "$3.20",  delta: "Δ −0.31", pnl: "+$96",  pnlNum: 96,   status: "OPEN"   },
  { contract: "SPY 480C 05/24",  type: "CALL", strike: "$480", expiry: "May 24", premium: "$8.70",  delta: "Δ 0.52",  pnl: "−$43",  pnlNum: -43,  status: "OPEN"   },
  { contract: "TSLA 250P 04/26", type: "PUT",  strike: "$250", expiry: "Apr 26", premium: "$6.10",  delta: "Δ −0.44", pnl: "+$180", pnlNum: 180,  status: "CLOSED" },
  { contract: "META 520C 04/19", type: "CALL", strike: "$520", expiry: "Apr 19", premium: "$15.80", delta: "Δ 0.61",  pnl: "+$440", pnlNum: 440,  status: "CLOSED" },
  { contract: "MSFT 420C 05/03", type: "CALL", strike: "$420", expiry: "May 03", premium: "$4.50",  delta: "Δ 0.39",  pnl: "+$127", pnlNum: 127,  status: "CLOSED" },
];

// NVDA options chain — current price ~$875, ATM = 880
const CALLS = [
  { strike: 820, last: "58.20", bid: "57.80", ask: "58.60", vol: "1,842", iv: "38.2%", delta: "0.82" },
  { strike: 840, last: "42.10", bid: "41.70", ask: "42.50", vol: "2,110", iv: "36.4%", delta: "0.71" },
  { strike: 860, last: "28.40", bid: "28.00", ask: "28.80", vol: "3,204", iv: "34.1%", delta: "0.58" },
  { strike: 880, last: "17.60", bid: "17.20", ask: "18.00", vol: "5,891", iv: "32.8%", delta: "0.48" }, // ATM
  { strike: 900, last:  "9.80", bid:  "9.40", ask: "10.20", vol: "4,723", iv: "31.5%", delta: "0.35" },
  { strike: 920, last:  "4.70", bid:  "4.30", ask:  "5.10", vol: "2,998", iv: "30.2%", delta: "0.22" },
  { strike: 940, last:  "2.10", bid:  "1.90", ask:  "2.30", vol: "1,456", iv: "29.6%", delta: "0.12" },
];
const PUTS = [
  { strike: 820, last:  "3.80", bid:  "3.60", ask:  "4.00", vol: "1,201", iv: "38.6%", delta: "−0.18" },
  { strike: 840, last:  "6.40", bid:  "6.10", ask:  "6.70", vol: "1,890", iv: "37.1%", delta: "−0.29" },
  { strike: 860, last: "10.90", bid: "10.60", ask: "11.20", vol: "2,634", iv: "35.0%", delta: "−0.42" },
  { strike: 880, last: "17.20", bid: "16.80", ask: "17.60", vol: "5,410", iv: "32.8%", delta: "−0.52" }, // ATM
  { strike: 900, last: "26.80", bid: "26.40", ask: "27.20", vol: "3,112", iv: "31.8%", delta: "−0.65" },
  { strike: 920, last: "38.50", bid: "38.10", ask: "38.90", vol: "1,784", iv: "30.9%", delta: "−0.78" },
  { strike: 940, last: "52.40", bid: "52.00", ask: "52.80", vol: "994",   iv: "30.1%", delta: "−0.88" },
];
const ATM_STRIKE = 880;

const GREEKS = [
  {
    symbol: "Δ",
    name: "Delta",
    color: P,
    desc: "Rate of change in option price per $1 move in the underlying asset.",
  },
  {
    symbol: "Γ",
    name: "Gamma",
    color: "#06B6D4",
    desc: "Rate of change in Delta per $1 move — highest near ATM at expiration.",
  },
  {
    symbol: "Θ",
    name: "Theta",
    color: "#F59E0B",
    desc: "Time decay — how much value the option loses each day as expiry approaches.",
  },
  {
    symbol: "ν",
    name: "Vega",
    color: "#00FF41",
    desc: "Sensitivity to implied volatility — a 1% IV change moves the premium by Vega.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChainRow({
  row,
  isAtm,
  side,
}: {
  row: (typeof CALLS)[0];
  isAtm: boolean;
  side: "call" | "put";
}) {
  return (
    <tr
      className="border-b transition-colors"
      style={{
        borderColor: isAtm ? `${P}40` : "rgba(255,255,255,0.05)",
        background: isAtm ? `${P}12` : "transparent",
      }}
    >
      <td className="px-3 py-2 font-mono text-xs" style={{ color: isAtm ? P : "#B8D4B8" }}>
        {row.last}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.bid}</td>
      <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.ask}</td>
      <td className="px-3 py-2 font-mono text-xs text-white">{row.vol}</td>
      <td className="px-3 py-2 font-mono text-xs" style={{ color: PG }}>{row.iv}</td>
      <td className="px-3 py-2 font-mono text-xs" style={{ color: P }}>{row.delta}</td>
      <td className="px-3 py-2">
        <button
          className="px-2 py-0.5 rounded text-xs font-bold font-mono transition-all hover:opacity-80"
          style={{ background: `${P}25`, color: P, border: `1px solid ${P}40` }}
        >
          Buy
        </button>
      </td>
    </tr>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalForm = {
  symbol: string;
  expiry: string;
  strike: string;
  side: "CALL" | "PUT";
  qty: string;
  limitPrice: string;
};

const EXPIRY_OPTIONS = ["May 10, 2026", "May 17, 2026", "May 24, 2026", "Jun 20, 2026", "Jul 18, 2026"];

function mockGreeks(form: ModalForm) {
  const s = parseFloat(form.strike) || 900;
  const p = parseFloat(form.limitPrice) || 10;
  return {
    delta: form.side === "CALL" ? (0.35 + Math.random() * 0.2).toFixed(2) : (-0.35 - Math.random() * 0.2).toFixed(2),
    gamma: (0.008 + Math.random() * 0.004).toFixed(4),
    theta: (-0.12 - Math.random() * 0.08).toFixed(3),
    vega:  (0.18 + Math.random() * 0.12).toFixed(3),
    maxProfit: form.side === "CALL" ? "Unlimited" : `$${(s * 0.9 * 100).toLocaleString()}`,
    maxLoss:   `$${(p * parseInt(form.qty || "1") * 100).toLocaleString()}`,
  };
}

function TradeModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ModalForm>({
    symbol: "NVDA",
    expiry: EXPIRY_OPTIONS[1],
    strike: "900",
    side: "CALL",
    qty: "1",
    limitPrice: "9.80",
  });
  const greeks = mockGreeks(form);

  function set(k: keyof ModalForm, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl p-6 relative"
        style={{
          background: "linear-gradient(145deg,#130820,#0D0618)",
          border: `1px solid ${P}50`,
          boxShadow: `0 0 40px ${P}20`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: P }} />
            <h3 className="font-black text-white text-lg">New Options Trade</h3>
          </div>
          <button onClick={onClose} className="text-genius-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Symbol */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Symbol</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
              style={{ background: `${P}10`, border: `1px solid ${P}30` }}
              value={form.symbol}
              onChange={e => set("symbol", e.target.value.toUpperCase())}
              placeholder="NVDA"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Expiry</label>
            <div className="relative">
              <select
                className="w-full rounded-lg px-3 py-2 text-sm font-mono text-white outline-none appearance-none"
                style={{ background: `${P}10`, border: `1px solid ${P}30` }}
                value={form.expiry}
                onChange={e => set("expiry", e.target.value)}
              >
                {EXPIRY_OPTIONS.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: PG }} />
            </div>
          </div>

          {/* Strike */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Strike Price</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
              style={{ background: `${P}10`, border: `1px solid ${P}30` }}
              value={form.strike}
              onChange={e => set("strike", e.target.value)}
              placeholder="900"
              type="number"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Contracts (qty)</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
              style={{ background: `${P}10`, border: `1px solid ${P}30` }}
              value={form.qty}
              onChange={e => set("qty", e.target.value)}
              placeholder="1"
              type="number"
              min="1"
            />
          </div>

          {/* Call / Put toggle */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Type</label>
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${P}30` }}>
              {(["CALL", "PUT"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => set("side", s)}
                  className="flex-1 py-2 text-xs font-black font-mono transition-all"
                  style={{
                    background: form.side === s ? P : `${P}10`,
                    color: form.side === s ? "#fff" : PG,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Limit price */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider mb-1 block" style={{ color: PG }}>Limit Price ($)</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
              style={{ background: `${P}10`, border: `1px solid ${P}30` }}
              value={form.limitPrice}
              onChange={e => set("limitPrice", e.target.value)}
              placeholder="9.80"
              type="number"
              step="0.01"
            />
          </div>
        </div>

        {/* Greeks display */}
        <div className="rounded-xl p-3 mb-4" style={{ background: `${P}08`, border: `1px solid ${P}20` }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: PG }}>Auto-calculated Greeks</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { sym: "Δ", label: "Delta",  val: greeks.delta },
              { sym: "Γ", label: "Gamma",  val: greeks.gamma },
              { sym: "Θ", label: "Theta",  val: greeks.theta },
              { sym: "ν", label: "Vega",   val: greeks.vega  },
            ].map(g => (
              <div key={g.label} className="text-center">
                <p className="text-lg font-black" style={{ color: P }}>{g.sym}</p>
                <p className="text-sm font-mono text-white">{g.val}</p>
                <p className="text-[10px] text-genius-muted">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Max profit / loss */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg p-3 text-center" style={{ background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }}>
            <p className="text-[10px] font-mono text-genius-muted uppercase mb-1">Max Profit</p>
            <p className="text-base font-black text-genius-green">{greeks.maxProfit}</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="text-[10px] font-mono text-genius-muted uppercase mb-1">Max Loss</p>
            <p className="text-base font-black text-red-400">{greeks.maxLoss}</p>
          </div>
        </div>

        {/* Submit */}
        <button
          className="w-full py-3 rounded-xl font-black text-sm font-mono transition-all hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${P}, ${PA})`,
            color: "#fff",
            boxShadow: `0 0 20px ${P}40`,
          }}
        >
          Place Options Order — {form.side} {form.qty}× {form.symbol} ${form.strike}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DerivativesPage() {
  const [showModal, setShowModal] = useState(false);
  const { open: openChart } = useTickerChart();

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showModal && <TradeModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={22} style={{ color: P }} />
            <h1 className="text-2xl font-black text-white">Delta Bot</h1>
            <span
              className="text-sm font-bold font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${P}20`, color: P, border: `1px solid ${P}40` }}
            >
              Derivatives Trading
            </span>
          </div>
          <p className="text-xs text-genius-muted font-mono flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse inline-block"
              style={{ background: P, boxShadow: `0 0 6px ${P}` }}
            />
            SCANNING OPTIONS FLOW
          </p>
        </div>

        {/* New trade button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${P}, ${PA})`,
            color: "#fff",
            boxShadow: `0 0 20px ${P}30`,
          }}
        >
          <Zap size={14} /> New Options Trade
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div
        className="flex items-center gap-6 flex-wrap rounded-xl px-5 py-3"
        style={{
          background: `${P}08`,
          border: `1px solid ${P}25`,
        }}
      >
        {[
          { label: "IV Rank",        value: "34%"  },
          { label: "VIX",            value: "18.4" },
          { label: "Put/Call Ratio", value: "0.82" },
          { label: "Next Earnings",  value: "NVDA in 3d" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-genius-muted uppercase">{s.label}</span>
            <span className="text-sm font-black font-mono" style={{ color: P }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg,#130820,#0D0618)",
              border: `1px solid ${P}30`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-genius-muted">{k.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${P}15` }}>
                <k.icon size={14} style={{ color: P }} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className="text-xs font-mono text-genius-muted">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Active Positions Table ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${P}25`, background: "linear-gradient(145deg,#130820,#0D0618)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${P}20` }}>
          <BarChart2 size={15} style={{ color: P }} />
          <h2 className="font-bold text-white">Active Options Positions</h2>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${P}15`, color: P, border: `1px solid ${P}30` }}
          >
            6 CONTRACTS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${P}15` }}>
                {["Contract", "Type", "Strike", "Expiry", "Premium", "Delta", "PnL", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-genius-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((p, i) => {
                const sym = p.contract.split(" ")[0];
                return (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${P}06`)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openChart(sym)}
                        className="font-bold font-mono text-xs hover:underline transition-opacity hover:opacity-75"
                        style={{ color: P }}
                      >
                        {p.contract}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-black font-mono px-2 py-0.5 rounded"
                        style={
                          p.type === "CALL"
                            ? { background: `${P}20`, color: PG, border: `1px solid ${P}30` }
                            : { background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }
                        }
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white">{p.strike}</td>
                    <td className="px-4 py-3 font-mono text-xs text-genius-muted">{p.expiry}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white">{p.premium}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: P }}>{p.delta}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: p.pnlNum >= 0 ? "#00FF41" : "#F87171" }}>
                      {p.pnl}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full"
                        style={
                          p.status === "OPEN"
                            ? { background: `${P}18`, color: P, border: `1px solid ${P}35` }
                            : { background: "rgba(0,255,65,0.1)", color: "#00FF41", border: "1px solid rgba(0,255,65,0.25)" }
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Options Chain ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${P}25`, background: "linear-gradient(145deg,#130820,#0D0618)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${P}20` }}>
          <Clock size={15} style={{ color: P }} />
          <h2 className="font-bold text-white">Options Chain — NVDA</h2>
          <span className="text-xs text-genius-muted font-mono ml-1">· Current price ~$875</span>
          <span
            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${P}15`, color: P, border: `1px solid ${P}30` }}
          >
            May 17, 2026
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x" style={{ borderColor: `${P}20` }}>
          {/* CALLS */}
          <div>
            <div className="px-4 py-2 text-center" style={{ borderBottom: `1px solid ${P}20`, background: `${P}10` }}>
              <span className="text-xs font-black font-mono" style={{ color: PG }}>CALLS</span>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${P}12` }}>
                  {["Last", "Bid", "Ask", "Vol", "IV", "Delta", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-[10px] font-mono text-genius-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CALLS.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(168,85,247,0.06)" }}>
                    {/* Inline strike column — centered */}
                    <td className="px-3 py-2 font-mono text-xs font-bold" style={{ color: row.strike === ATM_STRIKE ? P : "#B8D4B8" }}>{row.last}</td>
                    <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.bid}</td>
                    <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.ask}</td>
                    <td className="px-3 py-2 font-mono text-xs text-white">{row.vol}</td>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: PG }}>{row.iv}</td>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: P }}>{row.delta}</td>
                    <td className="px-3 py-2">
                      <button
                        className="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all hover:opacity-80"
                        style={{ background: `${P}25`, color: P, border: `1px solid ${P}40` }}
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Divider with strikes */}
          <div className="relative">
            {/* Strike column header */}
            <div className="px-4 py-2 text-center" style={{ borderBottom: `1px solid ${P}20`, background: `${P}10` }}>
              <span className="text-xs font-black font-mono" style={{ color: PG }}>PUTS</span>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${P}12` }}>
                  {["Strike", "Last", "Bid", "Ask", "Vol", "IV", "Delta", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-[10px] font-mono text-genius-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PUTS.map((row, i) => {
                  const isAtm = row.strike === ATM_STRIKE;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(168,85,247,0.06)",
                        background: isAtm ? `${P}12` : "transparent",
                      }}
                    >
                      <td className="px-3 py-2 font-mono text-xs font-black" style={{ color: isAtm ? P : "#B8D4B8" }}>
                        {row.strike}
                        {isAtm && <span className="ml-1 text-[9px] font-mono" style={{ color: PG }}>ATM</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: isAtm ? P : "#B8D4B8" }}>{row.last}</td>
                      <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.bid}</td>
                      <td className="px-3 py-2 font-mono text-xs text-genius-muted">{row.ask}</td>
                      <td className="px-3 py-2 font-mono text-xs text-white">{row.vol}</td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: PG }}>{row.iv}</td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: P }}>{row.delta}</td>
                      <td className="px-3 py-2">
                        <button
                          className="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all hover:opacity-80"
                          style={{ background: `${P}25`, color: P, border: `1px solid ${P}40` }}
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Greeks Education Strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {GREEKS.map(g => (
          <div
            key={g.name}
            className="rounded-xl p-4 transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(145deg,#130820,#0D0618)",
              border: `1px solid ${g.color}25`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-black" style={{ color: g.color }}>{g.symbol}</span>
              <span className="text-sm font-bold text-white">{g.name}</span>
            </div>
            <p className="text-xs text-genius-muted leading-relaxed">{g.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
