/**
 * POST /api/bot/run
 * Generates AI signals. When Alpaca keys are provided, executes real orders.
 * Without keys, returns signals only for local paper execution.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSignals, getUniverseSymbols, type AssetSignal } from "@/lib/signal-engine";
import { getBotConfig, type BotConfig } from "@/lib/bot-config";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getAccount, getPositions, placeOrder, closePosition, isStopTriggered,
} from "@/lib/alpaca";

interface RunResult {
  phase:      string;
  ts:         string;
  signals:    AssetSignal[];
  buy:        AssetSignal[];
  sell:       AssetSignal[];
  mode:       "live" | "local";
  executed?:  { symbol: string; side: "buy" | "sell"; notional: number; orderId: string }[];
  closed?:    { symbol: string; reason: string }[];
  portfolio?: { value: number; cash: number; buyingPower: number };
  error?:     string;
}

function now() { return new Date().toISOString(); }

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`bot-run:${ip}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const result: RunResult = {
    phase: "starting", ts: now(),
    signals: [], buy: [], sell: [],
    mode: "local",
  };

  try {
    let body: Partial<BotConfig> & { alpacaKey?: string; alpacaSecret?: string; alpacaPaper?: boolean } = {};
    try { body = await req.json(); } catch {}

    // Validate Alpaca keys if provided
    const rawKey    = typeof body.alpacaKey    === "string" ? body.alpacaKey.trim()    : "";
    const rawSecret = typeof body.alpacaSecret === "string" ? body.alpacaSecret.trim() : "";
    const alpacaKey    = /^[A-Z0-9_\-]{4,128}$/i.test(rawKey)    ? rawKey    : "";
    const alpacaSecret = /^[A-Z0-9_\-]{4,128}$/i.test(rawSecret) ? rawSecret : "";
    const alpacaPaper  = body.alpacaPaper !== false;
    const hasAlpaca    = alpacaKey.length > 4 && alpacaSecret.length > 4;

    const rawConf = Number(body.confidenceThreshold ?? getBotConfig().confidenceThreshold ?? 80);
    const confidenceThreshold = Number.isFinite(rawConf) ? Math.max(0, Math.min(100, rawConf)) : 80;

    const rawRisk  = typeof body.riskProfile === "string" ? body.riskProfile : "";
    const riskProfile = ["conservative","moderate","aggressive"].includes(rawRisk)
      ? rawRisk : (getBotConfig().riskProfile ?? "moderate");

    const rawUniverse = body.assetUniverse;
    const assetUniverse = Array.isArray(rawUniverse)
      ? (rawUniverse as unknown[]).filter(u => typeof u === "string").slice(0, 10) as string[]
      : (getBotConfig().assetUniverse ?? ["US Tech Stocks"]);

    const rawActive = body.botActive;
    const botActive = typeof rawActive === "boolean" ? rawActive : (getBotConfig().botActive ?? true);

    const rawMaxPos    = Number(body.maxPositions ?? getBotConfig().maxPositions ?? 10);
    const maxPositions = Number.isFinite(rawMaxPos) ? Math.max(1, Math.min(50, rawMaxPos)) : 10;

    const rawStop         = Number(body.stopLossOverride ?? getBotConfig().stopLossOverride ?? 0);
    const stopLossOverride = Number.isFinite(rawStop) ? Math.max(0, Math.min(50, rawStop)) : 0;

    if (!botActive) {
      return NextResponse.json({ ...result, phase: "skipped", error: "Bot is paused" });
    }

    // Phase 1: Ingest symbols
    result.phase = "1-ingest";
    const symbols = getUniverseSymbols(assetUniverse);
    if (!symbols.length) {
      return NextResponse.json({ ...result, error: "No symbols in universe" }, { status: 400 });
    }

    // Phase 2-3: Generate signals
    result.phase   = "2-process";
    const all      = await generateSignals(symbols, riskProfile as any, 50);
    result.phase   = "3-detect";
    result.signals = all;
    result.buy     = all.filter(s => s.action === "BUY"  && s.confidence >= confidenceThreshold);
    result.sell    = all.filter(s => s.action === "SELL" && s.confidence >= confidenceThreshold);

    // No Alpaca keys — return signals for local execution
    if (!hasAlpaca) {
      result.phase = "complete";
      result.mode  = "local";
      return NextResponse.json(result);
    }

    // Phase 4: Execute via Alpaca
    result.phase = "4-execute";
    result.mode  = "live";

    const [account, positions] = await Promise.all([
      getAccount(alpacaKey, alpacaSecret, alpacaPaper),
      getPositions(alpacaKey, alpacaSecret, alpacaPaper),
    ]);

    const portfolioValue = parseFloat(account.portfolio_value);
    const buyingPower    = parseFloat(account.buying_power);
    const cash           = parseFloat(account.cash);

    result.portfolio = { value: portfolioValue, cash, buyingPower };

    // Phase 5a: Stop-loss monitor
    result.phase  = "5-monitor";
    result.closed = [];
    const stopPct = stopLossOverride > 0 ? stopLossOverride : 5;

    for (const pos of positions) {
      if (isStopTriggered(pos, stopPct)) {
        try {
          await closePosition(alpacaKey, alpacaSecret, alpacaPaper, pos.symbol);
          result.closed.push({ symbol: pos.symbol, reason: `Stop-loss at ${stopPct}%` });
        } catch (err: any) {
          console.warn(`Stop-loss close failed for ${pos.symbol}:`, err.message);
        }
      }
    }

    // Phase 5b: Execute buys
    result.executed = [];
    const openCount      = positions.length - result.closed.length;
    const availableSlots = Math.max(0, maxPositions - openCount);
    const holdingSymbols = new Set(positions.map(p => p.symbol.replace("/USD", "-USD")));

    const tradeSizeUSD = Math.min(
      Math.max(buyingPower / Math.max(availableSlots, 1), 100),
      1000,
    );

    let executed = 0;
    for (const signal of result.buy) {
      if (executed >= availableSlots) break;
      if (holdingSymbols.has(signal.sym)) continue;
      if (tradeSizeUSD < 1) break;

      try {
        const order = await placeOrder(
          alpacaKey, alpacaSecret, alpacaPaper,
          signal.sym, "buy", tradeSizeUSD,
        );
        result.executed.push({
          symbol: signal.sym, side: "buy",
          notional: tradeSizeUSD, orderId: order.id,
        });
        executed++;
      } catch (err: any) {
        console.warn(`Buy failed for ${signal.sym}:`, err.message);
      }
    }

    // Execute sells on held positions
    const positionMap = new Map(positions.map(p => [p.symbol.replace("/USD", "-USD"), p]));
    for (const signal of result.sell) {
      const pos = positionMap.get(signal.sym);
      if (!pos) continue;
      try {
        const order = await closePosition(alpacaKey, alpacaSecret, alpacaPaper, pos.symbol);
        result.executed.push({
          symbol: signal.sym, side: "sell",
          notional: parseFloat(pos.market_value), orderId: order.id,
        });
      } catch (err: any) {
        console.warn(`Sell failed for ${signal.sym}:`, err.message);
      }
    }

    result.phase = "complete";
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("Bot run error:", err);
    return NextResponse.json({ ...result, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
