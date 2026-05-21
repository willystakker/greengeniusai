import { NextRequest, NextResponse } from "next/server";
import { generateSignals, getUniverseSymbols } from "@/lib/signal-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url    = req.nextUrl;
  const groups = (url.searchParams.get("groups") ?? "US Stocks,Crypto,ETFs,Growth").split(",").map(s => s.trim());
  const risk   = (url.searchParams.get("risk")   ?? "moderate") as any;

  const symbols = getUniverseSymbols(groups);
  if (!symbols.length) return NextResponse.json([]);

  try {
    const signals = await generateSignals(symbols, risk, 0);
    return NextResponse.json(signals, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
