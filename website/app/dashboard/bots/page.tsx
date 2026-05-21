"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, Zap, Activity, Rocket,
  ToggleLeft, ToggleRight, ExternalLink, ChevronRight,
  TrendingUp, Shield, Clock, BarChart2,
} from "lucide-react";

// ─── Bot definitions ──────────────────────────────────────────────────────────

const BOTS = [
  {
    id: "core",
    name: "GreenGenius Core",
    subtitle: "Equities Bot",
    Icon: Brain,
    color: "#00FF41",
    colorAlt: "#00D97E",
    colorRgb: "0,255,65",
    href: "/dashboard",
    description:
      "Scans 500+ US equities using momentum, earnings, and institutional flow signals. Executes market and limit orders through Alpaca in real time.",
    stats: [
      { label: "Win Rate",    value: "78.4%",  up: true  },
      { label: "Total Trades", value: "1,247", up: null  },
      { label: "Avg Return",  value: "+4.2%",  up: true  },
      { label: "Drawdown",    value: "-3.1%",  up: false },
    ],
    defaultOn: true,
    motif: "matrix",
    comparison: {
      assetClass:  "US Equities",
      strategy:    "Momentum + Earnings",
      exchange:    "Alpaca (US)",
      leverage:    "1×",
      avgHold:     "2–5 days",
      bestMonth:   "+18.2% (Nov)",
    },
  },
  {
    id: "delta",
    name: "Delta Bot",
    subtitle: "Derivatives & Options",
    Icon: Zap,
    color: "#A855F7",
    colorAlt: "#7C3AED",
    colorRgb: "168,85,247",
    href: "/dashboard/derivatives",
    description:
      "Trades options using Black-Scholes pricing, IV rank analysis, and gamma scalping. Targets high-probability spreads with defined risk.",
    stats: [
      { label: "Win Rate",    value: "71.2%",  up: true  },
      { label: "Total Trades", value: "312",   up: null  },
      { label: "Avg Return",  value: "+8.7%",  up: true  },
      { label: "Drawdown",    value: "-5.4%",  up: false },
    ],
    defaultOn: false,
    motif: "lightning",
    comparison: {
      assetClass:  "Options / Derivatives",
      strategy:    "IV Rank + Gamma Scalp",
      exchange:    "TD Ameritrade",
      leverage:    "Defined-risk",
      avgHold:     "3–14 days",
      bestMonth:   "+29.1% (Feb)",
    },
  },
  {
    id: "perp",
    name: "Perp Bot",
    subtitle: "Perpetuals Bot",
    Icon: Activity,
    color: "#06B6D4",
    colorAlt: "#0891B2",
    colorRgb: "6,182,212",
    href: "/dashboard/perpetuals",
    description:
      "Trades crypto perpetual futures on funding rate arbitrage, liquidation cascades, and order book imbalance. Long/short with up to 10× leverage.",
    stats: [
      { label: "Win Rate",    value: "66.8%",  up: true  },
      { label: "Total Trades", value: "891",   up: null  },
      { label: "Avg Return",  value: "+12.3%", up: true  },
      { label: "Drawdown",    value: "-8.9%",  up: false },
    ],
    defaultOn: false,
    motif: "circuit",
    comparison: {
      assetClass:  "Crypto Perps",
      strategy:    "Funding Rate Arb",
      exchange:    "Bybit / OKX",
      leverage:    "Up to 10×",
      avgHold:     "4h – 2 days",
      bestMonth:   "+44.7% (Mar)",
    },
  },
  {
    id: "ipo",
    name: "IPO Scout",
    subtitle: "IPO Bot",
    Icon: Rocket,
    color: "#F59E0B",
    colorAlt: "#D97706",
    colorRgb: "245,158,11",
    href: "/dashboard/ipos",
    description:
      "Monitors upcoming IPOs, SPAC mergers, and direct listings. Analyzes prospectus data, institutional demand, and grey market pricing to time entries.",
    stats: [
      { label: "Win Rate",    value: "82.1%",  up: true  },
      { label: "Total Trades", value: "47",    up: null  },
      { label: "Avg Return",  value: "+31.5%", up: true  },
      { label: "Drawdown",    value: "-4.2%",  up: false },
    ],
    defaultOn: false,
    motif: "orbit",
    comparison: {
      assetClass:  "IPOs / SPACs",
      strategy:    "Prospectus + Grey Mkt",
      exchange:    "Alpaca + IBKR",
      leverage:    "1×",
      avgHold:     "1–30 days",
      bestMonth:   "+67.3% (Jan)",
    },
  },
] as const;

// ─── Background patterns per motif ───────────────────────────────────────────

function motifStyle(motif: string, color: string): React.CSSProperties {
  switch (motif) {
    case "matrix":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, ${color}08 28px, ${color}08 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, ${color}08 28px, ${color}08 29px)`,
      };
    case "lightning":
      return {
        backgroundImage: `repeating-linear-gradient(60deg, transparent, transparent 20px, ${color}06 20px, ${color}06 21px), repeating-linear-gradient(-60deg, transparent, transparent 20px, ${color}06 20px, ${color}06 21px)`,
      };
    case "circuit":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 16px, ${color}07 16px, ${color}07 17px), repeating-linear-gradient(0deg, transparent, transparent 16px, ${color}07 16px, ${color}07 17px)`,
      };
    case "orbit":
      return {
        backgroundImage: `radial-gradient(ellipse at 80% 20%, ${color}10 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${color}08 0%, transparent 40%)`,
      };
    default:
      return {};
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BotsPage() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(BOTS.map(b => [b.id, b.defaultOn]))
  );

  const activeBots = BOTS.filter(b => active[b.id]);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-white">AI Trading Bots</h1>
        <p className="text-sm text-genius-muted mt-1">
          Independent AI agents — each with its own strategy, signal engine, and risk profile
        </p>
      </div>

      {/* ── Active bots summary strip ── */}
      <div className="genius-card rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
        <span className="text-xs font-mono text-genius-muted uppercase tracking-widest">Active Bots</span>
        {activeBots.length === 0 ? (
          <span className="text-xs text-genius-muted font-mono italic">No bots active — toggle one below</span>
        ) : (
          activeBots.map(b => (
            <div key={b.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }}
              />
              <span className="text-xs font-bold font-mono" style={{ color: b.color }}>
                {b.name}
              </span>
            </div>
          ))
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-xs font-mono text-genius-green">MONITORING</span>
        </div>
      </div>

      {/* ── 2×2 Bot cards grid ── */}
      <div className="grid grid-cols-2 gap-6">
        {BOTS.map((bot, i) => {
          const on = active[bot.id];
          return (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl overflow-hidden min-h-80 flex flex-col"
              style={{
                background: "linear-gradient(145deg, #0F1A0F, #0A120A)",
                border: on
                  ? `1px solid ${bot.color}60`
                  : `1px solid ${bot.color}30`,
                boxShadow: on
                  ? `0 0 30px ${bot.color}20, 0 0 60px ${bot.color}08`
                  : "none",
                opacity: on ? 1 : 0.65,
                transition: "all 0.4s ease",
              }}
            >
              {/* Motif background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={motifStyle(bot.motif, bot.color)}
              />

              {/* Subtle animated pulse overlay when ON */}
              {on && (
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  animate={{ opacity: [0.03, 0.08, 0.03] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${bot.color} 0%, transparent 70%)` }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-5">

                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Icon circle */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${bot.color}30, ${bot.colorAlt}20)`,
                        border: `1px solid ${bot.color}40`,
                        boxShadow: on ? `0 0 16px ${bot.color}30` : "none",
                      }}
                    >
                      <bot.Icon size={22} style={{ color: bot.color }} />
                    </div>
                    <div>
                      <h2 className="font-black text-white text-base leading-tight">{bot.name}</h2>
                      <p className="text-xs font-mono" style={{ color: bot.colorAlt }}>{bot.subtitle}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black font-mono"
                    style={{
                      background: on ? `${bot.color}20` : "rgba(255,255,255,0.05)",
                      border: on ? `1px solid ${bot.color}50` : "1px solid rgba(255,255,255,0.1)",
                      color: on ? bot.color : "#4A7A4A",
                    }}
                  >
                    {on ? (
                      <>
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: bot.color }}
                        />
                        ACTIVE
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-genius-muted" />
                        STANDBY
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-genius-text leading-relaxed mb-4">{bot.description}</p>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {bot.stats.map(s => (
                    <div
                      key={s.label}
                      className="rounded-lg px-2 py-2 text-center"
                      style={{ background: `${bot.color}08`, border: `1px solid ${bot.color}20` }}
                    >
                      <p
                        className="text-sm font-black font-mono"
                        style={{ color: s.up === true ? bot.color : s.up === false ? "#F87171" : "#fff" }}
                      >
                        {s.value}
                      </p>
                      <p className="text-[10px] text-genius-muted mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom: toggle + open link */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${bot.color}20` }}>
                  {/* Toggle */}
                  <button
                    onClick={() => setActive(prev => ({ ...prev, [bot.id]: !prev[bot.id] }))}
                    className="flex items-center gap-2 transition-all"
                  >
                    {on ? (
                      <ToggleRight size={28} style={{ color: bot.color }} />
                    ) : (
                      <ToggleLeft size={28} className="text-genius-muted" />
                    )}
                    <span
                      className="text-xs font-bold font-mono"
                      style={{ color: on ? bot.color : "#4A7A4A" }}
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </button>

                  {/* Open link */}
                  <Link
                    href={bot.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all hover:opacity-80"
                    style={{
                      background: `${bot.color}18`,
                      border: `1px solid ${bot.color}40`,
                      color: bot.color,
                    }}
                  >
                    Open Bot
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bot Comparison Table ── */}
      <div className="genius-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-genius-border">
          <BarChart2 size={16} className="text-genius-green" />
          <h2 className="font-bold text-white">Bot Comparison</h2>
          <span className="text-xs text-genius-muted font-mono ml-1">— all strategies side by side</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-genius-border">
                <th className="text-left px-5 py-3 text-xs text-genius-muted font-mono uppercase">Metric</th>
                {BOTS.map(b => (
                  <th key={b.id} className="px-4 py-3 text-xs font-mono uppercase" style={{ color: b.color }}>
                    <div className="flex items-center gap-1.5 justify-center">
                      <b.Icon size={12} />
                      {b.name.split(" ").slice(-1)[0]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "assetClass",  label: "Asset Class",   Icon: TrendingUp },
                { key: "strategy",    label: "Strategy",       Icon: Brain      },
                { key: "exchange",    label: "Exchange",       Icon: ExternalLink },
                { key: "leverage",    label: "Leverage",       Icon: Zap        },
                { key: "avgHold",     label: "Avg Hold Time",  Icon: Clock      },
                { key: "bestMonth",   label: "Best Month",     Icon: Shield     },
              ].map(({ key, label, Icon }, ri) => (
                <tr
                  key={key}
                  className="border-b border-genius-border/50 hover:bg-genius-card transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-genius-muted" />
                      <span className="text-xs text-genius-muted font-mono">{label}</span>
                    </div>
                  </td>
                  {BOTS.map(b => (
                    <td key={b.id} className="px-4 py-3 text-center">
                      <span className="text-xs font-mono text-genius-text">
                        {(b.comparison as any)[key]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
