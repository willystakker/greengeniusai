import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Rotating batches of stocks for news — covers broad market
const NEWS_BATCHES = [
  ["AAPL","MSFT","NVDA","AMZN","TSLA","META","GOOGL","JPM","V","UNH"],
  ["AMD","INTC","MU","AVGO","QCOM","TSM","ASML","AMAT","LRCX","KLAC"],
  ["SPY","QQQ","BAC","WFC","GS","MS","C","AXP","BLK","SCHW"],
  ["XOM","CVX","COP","SLB","OXY","MPC","PSX","VLO","HAL","DVN"],
  ["JNJ","PFE","MRK","ABBV","LLY","BMY","GILD","AMGN","BIIB","REGN"],
  ["AMZN","WMT","COST","TGT","HD","LOW","NKE","MCD","SBUX","CMG"],
  ["NFLX","DIS","PARA","WBD","CMCSA","T","VZ","TMUS","CHTR","DISH"],
  ["BA","RTX","LMT","NOC","GD","CAT","DE","HON","MMM","GE"],
  ["COIN","HOOD","SQ","PYPL","MA","V","FIS","FISV","GPN","AFRM"],
  ["PLTR","SNOW","DDOG","NET","CRWD","ZS","OKTA","PANW","S","FTNT"],
];

const BULLISH = ["surges","soars","rises","rally","beats","beat","growth","strong","upgrade","gains","profit","record","breakout","buy","outperform","bullish"];
const BEARISH = ["drops","falls","tumbles","crash","miss","misses","weak","downgrade","loss","concern","risk","warning","sell","underperform","bearish","investigation","lawsuit"];

function sentimentScore(title: string) {
  const t = (title ?? "").toLowerCase();
  let s = 0;
  BULLISH.forEach(w => { if (t.includes(w)) s++; });
  BEARISH.forEach(w => { if (t.includes(w)) s--; });
  return s > 0 ? "bullish" : s < 0 ? "bearish" : "neutral";
}

export async function GET() {
  try {
    // Rotate batch based on current minute
    const batchIdx = Math.floor(Date.now() / 60000) % NEWS_BATCHES.length;
    const symbols = NEWS_BATCHES[batchIdx];

    // Fetch news for 3 symbols concurrently (rate limit friendly)
    const picks = [symbols[0], symbols[3], symbols[6]];
    const results = await Promise.allSettled(
      picks.map(sym => (yf as any).search(sym, { newsCount: 8 }))
    );

    const allNews: any[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const items = (r.value as any).news ?? [];
        items.forEach((item: any) => {
          allNews.push({
            symbol:      picks[i],
            title:       item.title ?? "",
            publisher:   item.publisher ?? "",
            link:        item.link ?? "#",
            publishedAt: item.providerPublishTime ?? 0,
            sentiment:   sentimentScore(item.title ?? ""),
          });
        });
      }
    });

    // Sort by most recent
    allNews.sort((a, b) => b.publishedAt - a.publishedAt);

    return NextResponse.json({
      news: allNews.slice(0, 30),
      symbols,
      batchIdx,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err: any) {
    return NextResponse.json({ news: [], symbols: [], error: err.message });
  }
}
