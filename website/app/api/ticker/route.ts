import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();
const SYMBOLS = ["AAPL","NVDA","TSLA","MSFT","BTC-USD","ETH-USD","SOL-USD","SPY","AMZN","GOOGL","META","AMD"];

function formatPrice(price: number): string {
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET() {
  try {
    const results = await yf.quote(SYMBOLS, {
      fields: ["symbol", "regularMarketPrice", "regularMarketChangePercent"],
    });

    const quotes = Array.isArray(results) ? results : [results];

    const tickers = quotes
      .filter((q) => q.regularMarketPrice != null)
      .map((q) => ({
        sym: q.symbol.replace("-USD", ""),
        price: formatPrice(q.regularMarketPrice!),
        change: (q.regularMarketChangePercent! >= 0 ? "+" : "") + q.regularMarketChangePercent!.toFixed(2) + "%",
        up: q.regularMarketChangePercent! >= 0,
      }));

    return NextResponse.json(tickers, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Ticker fetch error:", err);
    // Fallback so the ticker never breaks the page
    return NextResponse.json([
      { sym: "AAPL", price: "189.42", change: "+2.14%", up: true },
      { sym: "NVDA", price: "875.39", change: "+4.82%", up: true },
      { sym: "TSLA", price: "248.11", change: "-1.23%", up: false },
      { sym: "MSFT", price: "414.67", change: "+1.07%", up: true },
      { sym: "BTC",  price: "68,240", change: "+3.41%", up: true },
      { sym: "ETH",  price: "3,812",  change: "+2.97%", up: true },
      { sym: "SOL",  price: "178.44", change: "+5.11%", up: true },
      { sym: "SPY",  price: "528.44", change: "+0.84%", up: true },
      { sym: "AMZN", price: "186.22", change: "-0.41%", up: false },
      { sym: "GOOGL",price: "170.58", change: "+1.55%", up: true },
      { sym: "META", price: "528.11", change: "+2.08%", up: true },
      { sym: "AMD",  price: "152.33", change: "+1.44%", up: true },
    ]);
  }
}
