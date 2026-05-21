import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(req: NextRequest) {
  // Sanitize: max 40 symbols, each max 10 chars, alphanumeric + dash + dot only
  const syms = (req.nextUrl.searchParams.get("syms") ?? "")
    .split(",")
    .map(s => s.replace(/[^A-Z0-9\-\.]/gi, "").slice(0, 10).toUpperCase())
    .filter(Boolean)
    .slice(0, 40);

  if (!syms.length) return NextResponse.json({ prices: {} });

  const prices: Record<string, { price: number; change: number; changePct: number }> = {};

  await Promise.allSettled(
    syms.map(async sym => {
      try {
        const q = await (yf as any).quote(sym, { fields: ["regularMarketPrice","regularMarketChange","regularMarketChangePercent"] });
        if (q?.regularMarketPrice) {
          prices[sym] = {
            price:     +q.regularMarketPrice.toFixed(4),
            change:    +(q.regularMarketChange ?? 0).toFixed(4),
            changePct: +((q.regularMarketChangePercent ?? 0) * 100).toFixed(2),
          };
        }
      } catch {}
    })
  );

  return NextResponse.json({ prices }, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=10" },
  });
}
