/**
 * POST /api/bot/run
 * Runs the AI signal engine and returns buy/sell recommendations.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSignals, getUniverseSymbols, type AssetSignal } from "@/lib/signal-engine";
import { getBotConfig, type BotConfig } from "@/lib/bot-config";
import { checkRateLimit } from "@/lib/rate-limit";

interface RunResult {
  phase:      string;
  ts:         string;
  signals:    AssetSignal[];
  buy:        AssetSignal[];
  sell:       AssetSignal[];
  mode:       "live";
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
    mode: "live",
  };

  try {
    let body: Partial<BotConfig> = {};
    try { body = await req.json(); } catch {}

    const confidenceThreshold = body.confidenceThreshold ?? getBotConfig().confidenceThreshold ?? 80;
    const riskProfile         = body.riskProfile         ?? getBotConfig().riskProfile         ?? "moderate";
    const assetUniverse       = body.assetUniverse        ?? getBotConfig().assetUniverse        ?? ["US Stocks"];
    const botActive           = body.botActive            ?? getBotConfig().botActive            ?? true;

    if (!botActive) {
      return NextResponse.json({ ...result, phase: "skipped", error: "Bot is paused" });
    }

    result.phase = "1-ingest";
    const symbols = getUniverseSymbols(assetUniverse);
    if (!symbols.length) {
      return NextResponse.json({ ...result, error: "No symbols in universe" }, { status: 400 });
    }

    result.phase   = "2-process";
    const all      = await generateSignals(symbols, riskProfile as any, 50);
    result.phase   = "3-detect";
    result.signals = all;
    result.buy     = all.filter(s => s.action === "BUY"  && s.confidence >= confidenceThreshold);
    result.sell    = all.filter(s => s.action === "SELL" && s.confidence >= confidenceThreshold);

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
