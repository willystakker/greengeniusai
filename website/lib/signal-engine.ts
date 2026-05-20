/**
 * GreenGeniusAI Signal Engine
 * Phase 1 (INGEST) + Phase 2 (PROCESS) + Phase 3 (DETECT)
 *
 * Uses real Yahoo Finance data to score every asset in the universe.
 * Scoring factors: MA momentum, golden/death cross, volume surge,
 * 52-week range position (RSI proxy), and intraday price action.
 */

import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type SignalAction = "BUY" | "SELL" | "HOLD";
export type RiskProfile  = "conservative" | "moderate" | "aggressive";

export interface AssetSignal {
  sym:        string;
  action:     SignalAction;
  confidence: number;       // 0–100
  price:      number;
  reasons:    string[];
  score:      number;       // raw score before normalization
}

const RISK_WEIGHT: Record<RiskProfile, number> = {
  conservative: 0.75,
  moderate:     1.0,
  aggressive:   1.25,
};

// Symbols for each universe group
export const UNIVERSE_SYMBOLS: Record<string, string[]> = {
  "US Stocks": ["AAPL","NVDA","MSFT","AMZN","GOOGL","META","TSLA","AMD","JPM","V"],
  "Crypto":    ["BTC-USD","ETH-USD","SOL-USD","BNB-USD","AVAX-USD"],
  "ETFs":      ["SPY","QQQ","ARKK","XLK","XLE"],
  "Growth":    ["PLTR","SNOW","NET","CRWD","DDOG"],
};

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function scoreQuote(q: any, risk: RiskProfile): AssetSignal {
  let score   = 0;
  const reasons: string[] = [];

  const price  = q.regularMarketPrice      ?? 0;
  const ma50   = q.fiftyDayAverage         ?? null;
  const ma200  = q.twoHundredDayAverage    ?? null;
  const vol    = q.regularMarketVolume     ?? null;
  const avgVol = q.averageVolume           ?? null;
  const hi52   = q.fiftyTwoWeekHigh        ?? null;
  const lo52   = q.fiftyTwoWeekLow         ?? null;
  const chgPct = q.regularMarketChangePercent ?? 0;

  // ── 1. Price vs 50-day MA (momentum) ──────────────────────
  if (ma50 && price) {
    const pct = ((price - ma50) / ma50) * 100;
    const pts = clamp(pct * 2, -22, 22);
    score += pts;
    if (pct > 3)       reasons.push(`Price ${pct.toFixed(1)}% above 50-day MA`);
    else if (pct < -3) reasons.push(`Price ${Math.abs(pct).toFixed(1)}% below 50-day MA`);
  }

  // ── 2. Golden / Death cross ────────────────────────────────
  if (ma50 && ma200) {
    if (ma50 > ma200) {
      score += 15;
      reasons.push("Golden cross — 50MA above 200MA");
    } else {
      score -= 12;
      reasons.push("Death cross — 50MA below 200MA");
    }
  }

  // ── 3. Volume surge ────────────────────────────────────────
  if (vol && avgVol && avgVol > 0) {
    const ratio = vol / avgVol;
    if (ratio > 2.0)      { score += 12; reasons.push(`Volume surge ${ratio.toFixed(1)}x average`); }
    else if (ratio > 1.4) { score += 6;  reasons.push(`Above-avg volume ${ratio.toFixed(1)}x`); }
    else if (ratio < 0.5) { score -= 5;  reasons.push("Weak volume — low conviction"); }
  }

  // ── 4. 52-week range position (RSI proxy) ──────────────────
  if (hi52 && lo52 && hi52 > lo52 && price) {
    const range    = hi52 - lo52;
    const position = (price - lo52) / range; // 0 = at low, 1 = at high
    if (position > 0.88)      { score -= 14; reasons.push("Near 52-week high — risk of pullback"); }
    else if (position > 0.65) { score += 7;  reasons.push("Upper range — strong trend momentum"); }
    else if (position < 0.15) { score += 14; reasons.push("Near 52-week low — potential reversal"); }
    else if (position < 0.35) { score += 4;  reasons.push("Lower range — accumulation zone"); }
  }

  // ── 5. Today's price action ────────────────────────────────
  if (Math.abs(chgPct) > 0.1) {
    const pts = clamp(chgPct * 2.5, -10, 10);
    score += pts;
    if (chgPct > 2)       reasons.push(`Strong intraday gain +${chgPct.toFixed(2)}%`);
    else if (chgPct < -2) reasons.push(`Intraday selloff ${chgPct.toFixed(2)}%`);
  }

  // ── Apply risk multiplier ──────────────────────────────────
  score *= RISK_WEIGHT[risk];

  // ── Convert to 0–100 confidence ───────────────────────────
  const confidence = clamp(Math.round(50 + score), 5, 97);

  // ── Determine action ───────────────────────────────────────
  let action: SignalAction;
  const threshold = risk === "aggressive" ? 65 : risk === "conservative" ? 80 : 72;
  if (confidence >= threshold)         action = "BUY";
  else if (confidence <= 100 - threshold) action = "SELL";
  else                                  action = "HOLD";

  return {
    sym:   q.symbol.replace("-USD", ""),
    action,
    confidence,
    price,
    reasons: reasons.length ? reasons : ["Neutral signals — no strong directional bias"],
    score: Math.round(score),
  };
}

export async function generateSignals(
  symbols: string[],
  risk: RiskProfile = "moderate",
  minConfidence = 72
): Promise<AssetSignal[]> {
  if (!symbols.length) return [];

  const results = await yf.quote(symbols, {
    fields: [
      "symbol","regularMarketPrice","regularMarketChangePercent",
      "regularMarketVolume","averageVolume","fiftyDayAverage",
      "twoHundredDayAverage","fiftyTwoWeekHigh","fiftyTwoWeekLow",
      "trailingPE","marketCap",
    ],
  });

  const quotes = (Array.isArray(results) ? results : [results]).filter(
    q => q.regularMarketPrice != null
  );

  const signals = quotes.map(q => scoreQuote(q, risk));

  return signals
    .filter(s => s.action !== "HOLD" || s.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);
}

export function getUniverseSymbols(groups: string[]): string[] {
  const syms = new Set<string>();
  for (const g of groups) {
    for (const s of (UNIVERSE_SYMBOLS[g] ?? [])) syms.add(s);
  }
  return Array.from(syms);
}
