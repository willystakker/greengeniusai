import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Indices, crypto, and sector ETFs
const INDEX_SYMBOLS   = ["^GSPC", "^IXIC", "^DJI", "^VIX", "BTC-USD", "ETH-USD"];
const SECTOR_SYMBOLS  = ["XLK", "XLV", "XLF", "XLE", "XLY", "XLI", "XLRE", "ARKK"];
const TICKER_SYMBOLS  = ["AAPL","NVDA","TSLA","MSFT","AMZN","GOOGL","META","AMD","SOL-USD","SPY"];

const INDEX_META: Record<string, { name: string; sym: string; invert?: boolean }> = {
  "^GSPC":   { name: "S&P 500",  sym: "SPX" },
  "^IXIC":   { name: "NASDAQ",   sym: "NDX" },
  "^DJI":    { name: "DOW",      sym: "DJI" },
  "^VIX":    { name: "VIX",      sym: "VIX", invert: true },
  "BTC-USD": { name: "Bitcoin",  sym: "BTC" },
  "ETH-USD": { name: "Ethereum", sym: "ETH" },
};

const SECTOR_META: Record<string, string> = {
  XLK:  "Technology",
  XLV:  "Healthcare",
  XLF:  "Financials",
  XLE:  "Energy",
  XLY:  "Consumer Disc",
  XLI:  "Industrials",
  XLRE: "Real Estate",
  ARKK: "Innovation/ARK",
};

function fmt(price: number) {
  if (price >= 10000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1000)  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (price >= 100)   return price.toFixed(2);
  if (price >= 1)     return price.toFixed(2);
  return price.toFixed(4);
}

// VIX → Fear & Greed score (0–100)
function vixToFearGreed(vix: number) {
  if (vix <= 11)  return Math.round(90 + (11 - vix) * 1.5);
  if (vix <= 15)  return Math.round(65 + (15 - vix) * 6.25);
  if (vix <= 20)  return Math.round(45 + (20 - vix) * 4);
  if (vix <= 30)  return Math.round(20 + (30 - vix) * 2.5);
  return Math.max(5, Math.round(20 - (vix - 30) * 0.5));
}

export async function GET() {
  try {
    const allSymbols = [...INDEX_SYMBOLS, ...SECTOR_SYMBOLS, ...TICKER_SYMBOLS];
    const results = await yf.quote(allSymbols, {
      fields: ["symbol", "regularMarketPrice", "regularMarketChange",
               "regularMarketChangePercent", "regularMarketPreviousClose",
               "regularMarketDayHigh", "regularMarketDayLow", "regularMarketVolume"],
    });
    const quotes = (Array.isArray(results) ? results : [results]).filter(
      q => q.regularMarketPrice != null
    );

    // Indices
    const indices = INDEX_SYMBOLS.map(sym => {
      const q = quotes.find(x => x.symbol === sym);
      const meta = INDEX_META[sym];
      if (!q) return null;
      const pct = q.regularMarketChangePercent ?? 0;
      return {
        sym:    meta.sym,
        name:   meta.name,
        price:  fmt(q.regularMarketPrice!),
        pct:    (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%",
        up:     meta.invert ? pct <= 0 : pct >= 0,
        change: q.regularMarketChange ?? 0,
        raw:    q.regularMarketPrice!,
      };
    }).filter(Boolean);

    // Find VIX for fear/greed
    const vixQ = quotes.find(q => q.symbol === "^VIX");
    const vixVal = vixQ?.regularMarketPrice ?? 18;
    const fearGreed = vixToFearGreed(vixVal);

    // Sectors
    const sectors = SECTOR_SYMBOLS.map(sym => {
      const q = quotes.find(x => x.symbol === sym);
      if (!q) return null;
      const pct = q.regularMarketChangePercent ?? 0;
      return { name: SECTOR_META[sym], change: +pct.toFixed(2), sym };
    }).filter(Boolean);

    // Tickers
    const tickers = TICKER_SYMBOLS.map(sym => {
      const q = quotes.find(x => x.symbol === sym);
      if (!q) return null;
      const pct = q.regularMarketChangePercent ?? 0;
      return {
        sym:    sym.replace("-USD", ""),
        price:  fmt(q.regularMarketPrice!),
        change: (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%",
        up:     pct >= 0,
      };
    }).filter(Boolean);

    return NextResponse.json(
      { indices, sectors, tickers, fearGreed, vix: vixVal, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=30" } }
    );
  } catch (err) {
    console.error("Market data error:", err);
    return NextResponse.json({ error: "Market data unavailable" }, { status: 500 });
  }
}
