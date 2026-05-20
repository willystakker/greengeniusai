/**
 * POST /api/bot/run
 * The full 5-phase AI investing loop.
 * Called by Vercel cron every 15 minutes AND by the dashboard manually.
 *
 * Phase 1 — INGEST:   Pull live data for every asset in the user's universe
 * Phase 2 — PROCESS:  Run the signal engine scoring algorithm
 * Phase 3 — DETECT:   Filter signals above the user's confidence threshold
 * Phase 4 — EXECUTE:  Place buy/sell orders via Alpaca
 * Phase 5 — MONITOR:  Check all open positions for stop-loss triggers
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSignals, getUniverseSymbols, type AssetSignal } from "@/lib/signal-engine";
import { getAccount, getPositions, placeOrder, closePosition, isStopTriggered } from "@/lib/alpaca";
import { getBotConfig, type BotConfig } from "@/lib/bot-config";
import { checkRateLimit } from "@/lib/rate-limit";

// Max allocation per position (fraction of portfolio)
const MAX_POSITION_FRACTION = 0.12;   // 12% per position
const MIN_ORDER_USD          = 10;     // Never place an order under $10

interface RunResult {
  phase:      string;
  ts:         string;
  signals:    AssetSignal[];
  executed:   { sym: string; side: string; amount: number; orderId: string }[];
  stopped:    { sym: string; reason: string }[];
  skipped:    { sym: string; reason: string }[];
  portfolio:  { value: number; cash: number; buyingPower: number } | null;
  error?:     string;
}

function now() { return new Date().toISOString(); }

export async function POST(req: NextRequest) {
  // Rate limit — max 10 bot runs per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`bot-run:${ip}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const result: RunResult = {
    phase:     "starting",
    ts:        now(),
    signals:   [],
    executed:  [],
    stopped:   [],
    skipped:   [],
    portfolio: null,
  };

  try {
    // Read bot config (localStorage on client; server reads from request body or env)
    let body: Partial<BotConfig & {
      alpacaKey?: string; alpacaSecret?: string; alpacaPaper?: boolean;
    }> = {};
    try { body = await req.json(); } catch {}

    const alpacaKey    = body.alpacaKey    ?? process.env.ALPACA_API_KEY    ?? "";
    const alpacaSecret = body.alpacaSecret ?? process.env.ALPACA_API_SECRET ?? "";
    const alpacaPaper  = body.alpacaPaper  ?? (process.env.ALPACA_PAPER !== "false");

    const confidenceThreshold = body.confidenceThreshold ?? 80;
    const riskProfile         = body.riskProfile         ?? "moderate";
    const assetUniverse       = body.assetUniverse        ?? ["US Stocks"];
    const maxPositions        = body.maxPositions         ?? 10;
    const stopLossPct         = body.stopLossOverride     ?? 8;
    const botActive           = body.botActive            ?? true;

    if (!botActive) {
      return NextResponse.json({ ...result, phase: "skipped", error: "Bot is paused" });
    }

    const hasAlpaca = alpacaKey.length > 4 && alpacaSecret.length > 4;

    // ── PHASE 1: INGEST ──────────────────────────────────────────────────────
    result.phase = "1-ingest";
    const symbols = getUniverseSymbols(assetUniverse);
    if (!symbols.length) {
      return NextResponse.json({ ...result, error: "No symbols in universe" }, { status: 400 });
    }

    // ── PHASE 2 + 3: PROCESS + DETECT ───────────────────────────────────────
    result.phase = "2-process";
    const allSignals = await generateSignals(symbols, riskProfile as any, 50);
    result.phase     = "3-detect";
    result.signals   = allSignals;

    const buySignals  = allSignals.filter(s => s.action === "BUY"  && s.confidence >= confidenceThreshold);
    const sellSignals = allSignals.filter(s => s.action === "SELL" && s.confidence >= confidenceThreshold);

    // ── PHASE 4: EXECUTE ─────────────────────────────────────────────────────
    result.phase = "4-execute";

    if (hasAlpaca) {
      const account   = await getAccount(alpacaKey, alpacaSecret, alpacaPaper);
      const positions = await getPositions(alpacaKey, alpacaSecret, alpacaPaper);
      const portValue = parseFloat(account.portfolio_value);
      const buyPower  = parseFloat(account.buying_power);

      result.portfolio = {
        value:        portValue,
        cash:         parseFloat(account.cash),
        buyingPower:  buyPower,
      };

      const positionSymbols = new Set(positions.map(p => p.symbol.replace("/USD","")));

      // ── Execute SELL signals on held positions ────────────────────────────
      for (const sig of sellSignals) {
        if (!positionSymbols.has(sig.sym)) {
          result.skipped.push({ sym: sig.sym, reason: "SELL signal but no position held" });
          continue;
        }
        try {
          const order = await closePosition(alpacaKey, alpacaSecret, alpacaPaper, sig.sym);
          result.executed.push({ sym: sig.sym, side: "sell", amount: 0, orderId: order.id });
        } catch (e: any) {
          result.skipped.push({ sym: sig.sym, reason: `Sell failed: ${e.message}` });
        }
      }

      // ── Execute BUY signals ───────────────────────────────────────────────
      const openSlots = maxPositions - (positionSymbols.size - result.executed.length);
      if (openSlots > 0 && buyPower > MIN_ORDER_USD) {
        const perPosition = Math.min(
          portValue * MAX_POSITION_FRACTION,
          buyPower / Math.max(1, buySignals.length)
        );

        for (const sig of buySignals.slice(0, openSlots)) {
          if (positionSymbols.has(sig.sym)) {
            result.skipped.push({ sym: sig.sym, reason: "Already in position" });
            continue;
          }
          const amount = Math.max(MIN_ORDER_USD, Math.min(perPosition, buyPower * 0.95));
          if (amount < MIN_ORDER_USD) {
            result.skipped.push({ sym: sig.sym, reason: `Insufficient buying power ($${buyPower.toFixed(0)})` });
            continue;
          }
          try {
            const order = await placeOrder(alpacaKey, alpacaSecret, alpacaPaper, sig.sym, "buy", amount);
            result.executed.push({ sym: sig.sym, side: "buy", amount, orderId: order.id });
          } catch (e: any) {
            result.skipped.push({ sym: sig.sym, reason: `Order failed: ${e.message}` });
          }
        }
      }

      // ── PHASE 5: MONITOR — check stop losses ─────────────────────────────
      result.phase = "5-monitor";
      for (const pos of positions) {
        if (isStopTriggered(pos, stopLossPct)) {
          const sym = pos.symbol.replace("/USD","");
          try {
            await closePosition(alpacaKey, alpacaSecret, alpacaPaper, pos.symbol);
            result.stopped.push({
              sym,
              reason: `Stop-loss triggered at ${stopLossPct}% loss (entry $${pos.avg_entry_price} → now $${pos.current_price})`,
            });
          } catch (e: any) {
            result.skipped.push({ sym, reason: `Stop-loss close failed: ${e.message}` });
          }
        }
      }
    } else {
      // Simulation mode — no Alpaca keys
      result.portfolio = null;
      for (const sig of buySignals.slice(0, maxPositions)) {
        result.executed.push({ sym: sig.sym, side: "buy (simulated)", amount: 500, orderId: `sim-${Date.now()}-${sig.sym}` });
      }
      result.skipped.push({ sym: "ALL", reason: "Alpaca keys not configured — running in simulation mode" });
    }

    result.phase = "complete";
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("Bot run error:", err);
    return NextResponse.json({ ...result, error: err.message }, { status: 500 });
  }
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
