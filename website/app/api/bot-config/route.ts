import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";
import type { BotConfig } from "@/lib/bot-config";

const ALLOWED_FREQUENCIES = ["Daily","Weekly","Bi-weekly","Monthly","One-time","Manual"];
const ALLOWED_RISK        = ["conservative","moderate","aggressive"];
const ALLOWED_GROUPS      = ["US Tech Stocks","Crypto Assets","Index ETFs","High-Growth","Global Equities","Commodities"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`bot-config:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const session      = sessionToken ? verifySessionToken(sessionToken) : null;

  let body: Partial<BotConfig>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  // Validate
  if (body.confidenceThreshold !== undefined) {
    const v = Number(body.confidenceThreshold);
    if (![70, 80, 90].includes(v)) return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
    body.confidenceThreshold = v;
  }
  if (body.rebalanceFrequency && !ALLOWED_FREQUENCIES.includes(body.rebalanceFrequency)) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }
  if (body.riskProfile && !ALLOWED_RISK.includes(body.riskProfile)) {
    return NextResponse.json({ error: "Invalid risk profile" }, { status: 400 });
  }
  if (body.assetUniverse) {
    if (!Array.isArray(body.assetUniverse) || body.assetUniverse.some(g => !ALLOWED_GROUPS.includes(g))) {
      return NextResponse.json({ error: "Invalid asset universe" }, { status: 400 });
    }
    if (body.assetUniverse.length === 0) {
      return NextResponse.json({ error: "Select at least one asset group" }, { status: 400 });
    }
  }
  if (body.maxPositions !== undefined) {
    const v = Number(body.maxPositions);
    if (v < 1 || v > 50) return NextResponse.json({ error: "maxPositions 1-50" }, { status: 400 });
    body.maxPositions = v;
  }

  // TODO: persist to Supabase keyed by session?.id
  // For now, acknowledge and let client persist to localStorage
  return NextResponse.json({ ok: true, config: body, userId: session?.id ?? null });
}

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const session      = sessionToken ? verifySessionToken(sessionToken) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // TODO: fetch from Supabase by session.id
  return NextResponse.json({ ok: true, config: null });
}
