import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const BULLISH = ["surges","soars","rises","rally","beats","beat","growth","strong","bullish","breakout","upgrade","upside","gains","profit","record","high","buy","outperform"];
const BEARISH = ["drops","falls","tumbles","crash","miss","misses","weak","bearish","breakdown","downgrade","downside","loss","losses","cut","low","concern","risk","warning","sell","underperform","investigation","lawsuit","fraud"];

function score(title: string) {
  const t = (title ?? "").toLowerCase();
  let s = 0;
  BULLISH.forEach(w => { if (t.includes(w)) s++; });
  BEARISH.forEach(w => { if (t.includes(w)) s--; });
  return { score: s, sentiment: s > 0 ? "bullish" : s < 0 ? "bearish" : "neutral" };
}

export async function GET(req: NextRequest) {
  const sym = (req.nextUrl.searchParams.get("sym") ?? "AAPL")
    .replace(/[^A-Z0-9\-\.]/gi, "")
    .slice(0, 10)
    .toUpperCase() || "AAPL";
  try {
    const results = await (yf as any).search(sym, { newsCount: 12 });
    const news = ((results as any).news ?? []).map((item: any) => ({
      title:       item.title ?? "",
      publisher:   item.publisher ?? "",
      link:        item.link ?? "#",
      publishedAt: item.providerPublishTime ?? 0,
      thumbnail:   item.thumbnail?.resolutions?.[0]?.url ?? null,
      ...score(item.title ?? ""),
    }));
    return NextResponse.json({ sym, news }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err: any) {
    return NextResponse.json({ sym, news: [], error: err.message }, { status: 200 });
  }
}
