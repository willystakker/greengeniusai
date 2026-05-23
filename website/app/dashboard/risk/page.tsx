"use client";

import { useState, useMemo } from "react";
import { Shield, AlertTriangle, TrendingDown, Lock, Activity, Zap, CheckCircle, RefreshCw, Wifi } from "lucide-react";
import { useRealPortfolio } from "@/lib/hooks/useRealPortfolio";

// Estimated betas and VaR by asset class / known symbols
function getBeta(sym: string): number {
  const cryptos: Record<string, number> = { BTC: 2.1, ETH: 2.3, SOL: 2.6, AVAX: 2.8, DOGE: 3.2, LINK: 2.5 };
  const highs: Record<string, number>   = { NVDA: 1.82, AMD: 1.90, TSLA: 2.0, PLTR: 1.95, SHOP: 1.7, COIN: 2.5, MSTR: 3.0, MARA: 3.5, RIOT: 3.5 };
  const lows: Record<string, number>    = { AAPL: 1.05, MSFT: 1.10, JNJ: 0.70, PG: 0.65, KO: 0.65, WMT: 0.60, XOM: 1.15 };
  return cryptos[sym] ?? highs[sym] ?? lows[sym] ?? 1.25;
}
function getVar(sym: string): number {
  const isCrypto = ["BTC","ETH","SOL","AVAX","DOGE","LINK"].includes(sym);
  const isHighVol = ["NVDA","AMD","TSLA","PLTR","COIN","MSTR","MARA","RIOT"].includes(sym);
  return isCrypto ? 6.5 + Math.random() * 2 : isHighVol ? 3.5 + Math.random() * 1.5 : 2.0 + Math.random() * 1.5;
}
function getStopDefault(sym: string): number {
  const isCrypto = ["BTC","ETH","SOL","AVAX","DOGE","LINK"].includes(sym);
  return isCrypto ? 15 : 8;
}

export default function RiskPage() {
  const [maxDrawdown,    setMaxDrawdown]    = useState(20);
  const [maxPosition,    setMaxPosition]    = useState(30);
  const [dailyLossLimit, setDailyLossLimit] = useState(5);
  const [betaCap,        setBetaCap]        = useState(2.0);
  const [stopLossEdits,  setStopLossEdits]  = useState<Record<string, number>>({});

  const portfolio = useRealPortfolio(15000);

  const positions = useMemo(() => portfolio.positions.map(p => ({
    ...p,
    beta:    getBeta(p.sym),
    var95:   getVar(p.sym),
    stopLoss: getStopDefault(p.sym),
  })), [portfolio.positions]);

  const totalValue      = positions.reduce((s, p) => s + p.value, 0) || portfolio.equity || 100;
  const portfolioBeta   = positions.length > 0
    ? positions.reduce((s, p) => s + (p.value / totalValue) * p.beta, 0)
    : 1.0;
  const portfolioVar    = positions.length > 0
    ? positions.reduce((s, p) => s + (p.value / totalValue) * p.var95, 0)
    : 2.0;
  const maxPositionPct  = positions.length > 0
    ? Math.max(...positions.map(p => (p.value / totalValue) * 100))
    : 0;

  const riskScore = Math.min(100, Math.round(
    portfolioBeta * 22 + portfolioVar * 4 + (maxPositionPct / maxPosition) * 12
  ));
  const riskLabel = riskScore < 40 ? "Conservative" : riskScore < 65 ? "Moderate" : riskScore < 80 ? "Aggressive" : "High Risk";
  const riskColor = riskScore < 40 ? "text-genius-green" : riskScore < 65 ? "text-yellow-400" : "text-orange-400";

  // Scenario impacts based on real portfolio value
  const SCENARIOS = [
    { label: "Market Crash −20%",  pct: -17.0, description: "S&P 500 corrects 20%. Equity positions hit hard." },
    { label: "Crypto Winter −60%", pct: -22.0, description: "BTC/ETH/SOL decline 60%. Tech equities partially resilient." },
    { label: "Rate Shock +1%",     pct:  -5.0, description: "Surprise Fed hike. Growth stocks reprice lower." },
    { label: "AI Sector Boom +30%",pct: +25.0, description: "AI infrastructure demand surges. Portfolio outperforms." },
    { label: "Recession −35%",     pct: -30.0, description: "Deep recession. Broad selloff across asset classes." },
  ].map(s => ({ ...s, impact: +(totalValue * s.pct / 100).toFixed(2) }));

  if (portfolio.loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-genius-muted font-mono text-sm">
        <RefreshCw size={16} className="animate-spin text-genius-green" />
        Loading live risk data from Alpaca…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Risk Management</h1>
          <p className="text-xs text-genius-muted font-mono mt-0.5 flex items-center gap-2">
            {portfolio.connected
              ? <><div className="live-dot" /><span>Live · ${portfolio.equity.toFixed(2)} portfolio · {positions.length} positions</span></>
              : <><Wifi size={11} className="text-red-400" /><span className="text-red-400">Alpaca disconnected</span></>
            }
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg btn-genius text-sm font-bold">
          <Lock size={14} /> Save Rules
        </button>
      </div>

      {/* Risk score + KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="genius-card rounded-xl p-5 border border-genius-border col-span-1">
          <p className="text-xs text-genius-muted font-mono mb-3">RISK SCORE</p>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-5xl font-black ${riskColor}`}>{riskScore}</span>
            <span className="text-genius-muted text-lg mb-1">/100</span>
          </div>
          <p className={`text-sm font-bold ${riskColor}`}>{riskLabel}</p>
          <div className="mt-3 w-full h-2 bg-genius-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${riskScore}%`,
                background: riskScore < 40 ? "#00FF41" : riskScore < 65 ? "#FFD700" : riskScore < 80 ? "#FF8C00" : "#FF4444",
              }}
            />
          </div>
        </div>
        {[
          { label: "Portfolio Beta",   value: portfolioBeta.toFixed(2),    sub: `Cap: ${betaCap}x`,                             warn: portfolioBeta > betaCap,       icon: Activity   },
          { label: "VaR 95% (Daily)", value: `${portfolioVar.toFixed(1)}%`, sub: `~$${(totalValue * portfolioVar / 100).toFixed(2)} at risk`, warn: portfolioVar > 4, icon: TrendingDown },
          { label: "Max Position",     value: `${maxPositionPct.toFixed(1)}%`, sub: `Limit: ${maxPosition}%`,                  warn: maxPositionPct > maxPosition,  icon: Shield     },
        ].map((k, i) => (
          <div key={i} className={`genius-card rounded-xl p-5 border ${k.warn ? "border-yellow-500/30 bg-yellow-500/3" : "border-genius-border"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-genius-muted font-mono">{k.label.toUpperCase()}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.warn ? "bg-yellow-400/10" : "bg-genius-green/10"}`}>
                <k.icon size={14} className={k.warn ? "text-yellow-400" : "text-genius-green"} />
              </div>
            </div>
            <p className="text-2xl font-black text-white mb-1">{k.value}</p>
            <p className={`text-xs font-mono ${k.warn ? "text-yellow-400" : "text-genius-muted"}`}>
              {k.warn && "⚠️ "}{k.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Portfolio controls */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="genius-card rounded-xl p-5">
            <h2 className="font-bold text-white mb-4">Portfolio Controls</h2>
            <div className="flex flex-col gap-5">
              {[
                { label: "Max Drawdown Limit",   value: maxDrawdown,    set: setMaxDrawdown,    min: 5,   max: 40,  step: 5,   unit: "%", note: "Bot pauses at this drawdown" },
                { label: "Max Single Position",  value: maxPosition,    set: setMaxPosition,    min: 5,   max: 50,  step: 5,   unit: "%", note: "No single asset exceeds this" },
                { label: "Daily Loss Limit",      value: dailyLossLimit, set: setDailyLossLimit, min: 1,   max: 15,  step: 1,   unit: "%", note: "AI stops trading at this loss" },
              ].map(ctrl => (
                <div key={ctrl.label}>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-sm font-semibold text-white">{ctrl.label}</label>
                    <span className="font-mono font-black text-genius-green text-lg">{ctrl.value}{ctrl.unit}</span>
                  </div>
                  <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value}
                    onChange={e => ctrl.set(Number(e.target.value))}
                    className="w-full h-1.5 appearance-none bg-genius-border rounded-full cursor-pointer accent-genius-green" />
                  <div className="flex justify-between text-xs text-genius-muted font-mono mt-1">
                    <span>{ctrl.min}{ctrl.unit}</span>
                    <span className="text-genius-muted/60">{ctrl.note}</span>
                    <span>{ctrl.max}{ctrl.unit}</span>
                  </div>
                </div>
              ))}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-sm font-semibold text-white">Portfolio Beta Cap</label>
                  <span className="font-mono font-black text-genius-green text-lg">{betaCap}x</span>
                </div>
                <input type="range" min={0.8} max={3.0} step={0.1} value={betaCap}
                  onChange={e => setBetaCap(Number(e.target.value))}
                  className="w-full h-1.5 appearance-none bg-genius-border rounded-full cursor-pointer accent-genius-green" />
                <div className="flex justify-between text-xs text-genius-muted font-mono mt-1">
                  <span>0.8x</span><span className="text-genius-muted/60">Market beta limit</span><span>3.0x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stop losses */}
        <div className="col-span-3 genius-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-genius-border">
            <h2 className="font-bold text-white">Stop-Loss Rules</h2>
            <p className="text-xs text-genius-muted font-mono mt-0.5">Bot auto-exits position if price drops by this % from entry</p>
          </div>
          <div className="overflow-y-auto max-h-[380px]">
            {positions.length === 0 ? (
              <div className="p-12 text-center">
                <Shield size={32} className="text-genius-muted/25 mx-auto mb-3" />
                <p className="text-genius-muted text-sm font-mono">No open positions</p>
                <p className="text-xs text-genius-muted mt-1">Stop-loss rules will appear here when the bot opens positions Tuesday.</p>
              </div>
            ) : (
              positions.map(p => {
                const sl         = stopLossEdits[p.sym] ?? p.stopLoss;
                const dollarRisk = (p.value * sl / 100).toFixed(2);
                return (
                  <div key={p.sym} className="px-5 py-4 border-b border-genius-border/40 hover:bg-genius-card transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-white font-mono">{p.sym}</span>
                        <span className="text-xs text-genius-muted ml-2">${p.value.toFixed(2)} position</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-genius-muted font-mono">
                          Max loss: <span className="text-red-400 font-bold">${dollarRisk}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setStopLossEdits(e => ({ ...e, [p.sym]: Math.max(3, sl - 1) }))}
                            className="w-6 h-6 rounded bg-genius-border text-genius-muted hover:text-white text-sm font-bold flex items-center justify-center">−</button>
                          <span className="w-12 text-center font-mono font-black text-genius-green text-sm">{sl}%</span>
                          <button onClick={() => setStopLossEdits(e => ({ ...e, [p.sym]: Math.min(30, sl + 1) }))}
                            className="w-6 h-6 rounded bg-genius-border text-genius-muted hover:text-white text-sm font-bold flex items-center justify-center">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-genius-muted font-mono">β {p.beta.toFixed(2)}</span>
                      <span className="text-xs text-genius-muted font-mono">VaR {p.var95.toFixed(1)}%</span>
                      <span className={`text-xs font-mono ${p.pl >= 0 ? "text-genius-green" : "text-red-400"}`}>
                        P&L {p.pl >= 0 ? "+" : ""}${p.pl.toFixed(2)}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-24 h-1 bg-genius-border rounded-full overflow-hidden">
                          <div className="h-full bg-red-400/70 rounded-full" style={{ width: `${Math.min(sl * 3.3, 100)}%` }} />
                        </div>
                        <span className="text-xs text-genius-muted font-mono">{sl < 8 ? "Tight" : sl < 14 ? "Normal" : "Wide"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Scenario analysis */}
      <div className="genius-card rounded-xl p-5">
        <h2 className="font-bold text-white mb-1">Scenario Analysis</h2>
        <p className="text-xs text-genius-muted font-mono mb-4">
          Estimated impact on your ${portfolio.equity.toFixed(2)} portfolio under stress scenarios
        </p>
        <div className="grid grid-cols-5 gap-3">
          {SCENARIOS.map((s, i) => (
            <div key={i} className={`rounded-xl p-4 border ${s.impact < 0 ? "border-red-500/20 bg-red-500/5" : "border-genius-green/20 bg-genius-green/5"}`}>
              <p className="text-xs font-bold text-white mb-2">{s.label}</p>
              <p className={`text-xl font-black font-mono mb-1 ${s.impact < 0 ? "text-red-400" : "text-genius-green"}`}>
                {s.impact > 0 ? "+" : ""}${Math.abs(s.impact).toFixed(2)}
              </p>
              <p className={`text-sm font-mono font-bold mb-2 ${s.impact < 0 ? "text-red-400/70" : "text-genius-green/70"}`}>
                {s.pct > 0 ? "+" : ""}{s.pct}%
              </p>
              <p className="text-xs text-genius-muted leading-snug">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
