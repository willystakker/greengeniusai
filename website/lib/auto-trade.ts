"use client";

import { getBotConfig } from "./bot-config";
import { executePaperTrade, loadPaperPortfolio } from "./paper-trading";

export type AutoTradeResult = {
  executed: number;
  signals:  number;
  mode:     "live" | "local";
  trades:   { sym: string; side: "buy" | "sell"; amount: number; price: number; reason: string }[];
  error?:   string;
};

function getAlpacaKeys() {
  if (typeof window === "undefined") return { key: "", secret: "", paper: true };
  return {
    key:    localStorage.getItem("ggai_alpaca_key")    ?? "",
    secret: localStorage.getItem("ggai_alpaca_secret") ?? "",
    paper:  localStorage.getItem("ggai_alpaca_paper")  !== "false",
  };
}

export async function runAutoTrade(): Promise<AutoTradeResult> {
  const cfg = getBotConfig();
  if (!cfg.botActive) return { executed: 0, signals: 0, mode: "local", trades: [], error: "Bot is paused" };

  const { key, secret, paper } = getAlpacaKeys();
  const hasAlpaca = key.length > 4 && secret.length > 4;

  const body: Record<string, any> = {
    confidenceThreshold: cfg.confidenceThreshold,
    riskProfile:         cfg.riskProfile ?? "moderate",
    assetUniverse:       cfg.assetUniverse,
    maxPositions:        cfg.maxPositions,
    botActive:           cfg.botActive,
    stopLossOverride:    cfg.stopLossOverride,
  };

  if (hasAlpaca) {
    body.alpacaKey    = key;
    body.alpacaSecret = secret;
    body.alpacaPaper  = paper;
  }

  try {
    const res = await fetch("/api/bot/run", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) return { executed: 0, signals: 0, mode: "local", trades: [], error: "Signal engine error" };

    const data = await res.json();

    // Alpaca handled execution server-side
    if (hasAlpaca && data.mode === "live") {
      const execTrades = (data.executed ?? []).map((e: any) => ({
        sym:    e.symbol,
        side:   e.side,
        amount: e.notional,
        price:  0,
        reason: "Alpaca order placed",
      }));
      return {
        executed: execTrades.length,
        signals:  data.signals?.length ?? 0,
        mode:     "live",
        trades:   execTrades,
      };
    }

    // Local execution — run signals through paper portfolio
    const buys:  { sym: string; price: number; confidence: number; reasons?: string[] }[] = data.buy  ?? [];
    const sells: { sym: string; price: number; confidence: number; reasons?: string[] }[] = data.sell ?? [];

    const result: AutoTradeResult = { executed: 0, signals: buys.length + sells.length, mode: "local", trades: [] };

    // Sells first
    let fresh = loadPaperPortfolio();
    if (fresh.cash === 0 && Object.keys(fresh.positions).length === 0) {
      return { ...result, error: "Insufficient funds" };
    }

    for (const signal of sells) {
      const pos = fresh.positions[signal.sym];
      if (!pos) continue;
      const sellAmount = pos.shares * signal.price;
      const r = executePaperTrade(
        signal.sym, "sell", sellAmount, signal.price,
        signal.reasons?.join("; ") ?? "AI SELL signal", signal.confidence,
      );
      if (r.success) {
        result.executed++;
        result.trades.push({ sym: signal.sym, side: "sell", amount: sellAmount, price: signal.price, reason: signal.reasons?.join("; ") ?? "" });
        fresh = r.portfolio;
      }
    }

    // Buys
    fresh = loadPaperPortfolio();
    const currentCount   = Object.keys(fresh.positions).length;
    const availableSlots = Math.max(0, (cfg.maxPositions ?? 10) - currentCount);
    const eligibleBuys   = buys.filter(s => !fresh.positions[s.sym]).slice(0, availableSlots);

    if (eligibleBuys.length > 0 && fresh.cash >= 10) {
      const perTrade = Math.min(fresh.cash / eligibleBuys.length, fresh.cash * 0.30, fresh.cash);
      for (const signal of eligibleBuys) {
        fresh = loadPaperPortfolio();
        if (fresh.cash < 10) break;
        const size = Math.min(perTrade, fresh.cash);
        if (size < 1) continue;
        const r = executePaperTrade(
          signal.sym, "buy", size, signal.price,
          signal.reasons?.join("; ") ?? "AI BUY signal", signal.confidence,
        );
        if (r.success) {
          result.executed++;
          result.trades.push({ sym: signal.sym, side: "buy", amount: size, price: signal.price, reason: signal.reasons?.join("; ") ?? "" });
          fresh = r.portfolio;
        }
      }
    }

    return result;
  } catch (e: any) {
    return { executed: 0, signals: 0, mode: "local", trades: [], error: e.message };
  }
}
