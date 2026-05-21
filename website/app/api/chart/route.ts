import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const RANGES: Record<string, { interval: string; days: number; fmt: Intl.DateTimeFormatOptions }> = {
  "1D": { interval: "5m",  days: 1,    fmt: { hour: "2-digit", minute: "2-digit" } },
  "1W": { interval: "1h",  days: 7,    fmt: { month: "short", day: "numeric", hour: "2-digit" } },
  "1M": { interval: "1d",  days: 30,   fmt: { month: "short", day: "numeric" } },
  "3M": { interval: "1d",  days: 90,   fmt: { month: "short", day: "numeric" } },
  "1Y": { interval: "1wk", days: 365,  fmt: { month: "short", year: "2-digit" } },
  "5Y": { interval: "1mo", days: 1825, fmt: { month: "short", year: "2-digit" } },
};

const CRYPTO = new Set(["BTC","ETH","SOL","BNB","AVAX","DOGE","ADA","XRP","DOT","LINK","MATIC","LTC"]);

// Map display symbols to Yahoo Finance symbols
function toYahooSym(sym: string): string {
  if (CRYPTO.has(sym)) return `${sym}-USD`;
  const map: Record<string, string> = {
    "SPX": "^GSPC", "SPY": "SPY", "NDX": "^IXIC", "QQQ": "QQQ",
    "DJI": "^DJI",  "VIX": "^VIX", "GLD": "GC=F",  "OIL": "CL=F",
    "AAPL-USD": "AAPL", "BTC-USD": "BTC-USD", "ETH-USD": "ETH-USD",
  };
  return map[sym] ?? sym;
}

export async function GET(req: NextRequest) {
  const sym   = req.nextUrl.searchParams.get("sym") ?? "AAPL";
  const range = req.nextUrl.searchParams.get("range") ?? "1M";
  const cfg   = RANGES[range] ?? RANGES["1M"];
  const period1 = new Date(Date.now() - cfg.days * 86_400_000);
  const yahooSym = toYahooSym(sym);

  try {
    const [chartRes, quoteRes] = await Promise.all([
      yf.chart(yahooSym, { period1, interval: cfg.interval as any }),
      yf.quote(yahooSym, { fields: ["regularMarketPrice","regularMarketChangePercent","regularMarketOpen","regularMarketDayHigh","regularMarketDayLow","regularMarketVolume","marketCap","shortName","longName"] }),
    ]);

    const quotes = (chartRes.quotes ?? [])
      .filter((q: any) => q.close != null)
      .map((q: any) => ({
        t: new Date(q.date).toLocaleString("en-US", cfg.fmt),
        c: +q.close.toFixed(2),
        h: q.high ? +q.high.toFixed(2) : null,
        l: q.low  ? +q.low.toFixed(2)  : null,
        v: q.volume ?? null,
      }));

    const meta = chartRes.meta as any;
    const q    = Array.isArray(quoteRes) ? quoteRes[0] : quoteRes;

    return NextResponse.json({
      sym,
      name:      (q as any).longName ?? (q as any).shortName ?? meta.longName ?? sym,
      price:     (q as any).regularMarketPrice ?? meta.regularMarketPrice,
      changePct: (q as any).regularMarketChangePercent ?? 0,
      open:      (q as any).regularMarketOpen,
      high:      (q as any).regularMarketDayHigh,
      low:       (q as any).regularMarketDayLow,
      volume:    (q as any).regularMarketVolume,
      marketCap: (q as any).marketCap,
      quotes,
    }, {
      headers: { "Cache-Control": `public, s-maxage=${cfg.interval === "5m" ? 60 : 300}, stale-while-revalidate=60` },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
