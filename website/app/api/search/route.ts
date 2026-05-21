import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TYPE_LABEL: Record<string, string> = {
  EQUITY:        "Stock",
  ETF:           "ETF",
  MUTUALFUND:    "Fund",
  INDEX:         "Index",
  CRYPTOCURRENCY:"Crypto",
  CURRENCY:      "Forex",
  FUTURE:        "Futures",
  OPTION:        "Option",
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) return NextResponse.json({ results: [] });

  try {
    const raw = await (yf as any).search(q, { quotesCount: 20, newsCount: 0, enableFuzzyQuery: true });
    const results = ((raw as any).quotes ?? [])
      .filter((r: any) => r.symbol && r.quoteType !== "OPTION")
      .slice(0, 15)
      .map((r: any) => ({
        sym:      r.symbol,
        name:     r.longname ?? r.shortname ?? r.symbol,
        type:     TYPE_LABEL[r.quoteType] ?? r.quoteType ?? "Stock",
        exchange: r.exchDisp ?? r.exchange ?? "",
        score:    r.score ?? 0,
      }));

    return NextResponse.json({ results }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err.message }, { status: 200 });
  }
}
