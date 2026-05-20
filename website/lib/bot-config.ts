export type AssetGroup =
  | "US Tech Stocks"
  | "Crypto Assets"
  | "Index ETFs"
  | "High-Growth"
  | "Global Equities"
  | "Commodities";

export type RebalanceFrequency =
  | "Daily" | "Weekly" | "Bi-weekly" | "Monthly" | "One-time" | "Manual";

export type BotConfig = {
  confidenceThreshold: number;          // 70 | 80 | 90
  rebalanceFrequency: RebalanceFrequency;
  assetUniverse: AssetGroup[];
  riskProfile: "conservative" | "moderate" | "aggressive";
  botActive: boolean;
  maxPositions: number;
  autoCompound: boolean;
  stopLossOverride: number;             // % — 0 means use per-position rules
  updatedAt: string;
};

export const ASSET_SYMBOLS: Record<AssetGroup, string[]> = {
  "US Tech Stocks":  ["NVDA","AAPL","MSFT","META","AMZN","GOOGL","AMD","SMCI","INTC","CRM"],
  "Crypto Assets":   ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE"],
  "Index ETFs":      ["SPY","QQQ","IWM","VTI","VOO","ARKK","SOXL"],
  "High-Growth":     ["TSLA","PLTR","RKLB","ASTS","IONQ","MSTR","COIN"],
  "Global Equities": ["BABA","TSM","ASML","SAP","NVO","SONY","TM"],
  "Commodities":     ["GLD","SLV","USO","PDBC","CORN","WEAT"],
};

export const ASSET_GROUP_META: Record<AssetGroup, { emoji: string; class: string }> = {
  "US Tech Stocks":  { emoji: "💻", class: "Equity" },
  "Crypto Assets":   { emoji: "₿",  class: "Crypto" },
  "Index ETFs":      { emoji: "📊", class: "ETF" },
  "High-Growth":     { emoji: "🚀", class: "Equity" },
  "Global Equities": { emoji: "🌍", class: "Equity" },
  "Commodities":     { emoji: "🪙", class: "Commodity" },
};

export const DEFAULT_CONFIG: BotConfig = {
  confidenceThreshold: 80,
  rebalanceFrequency:  "Weekly",
  assetUniverse:       ["US Tech Stocks", "Crypto Assets", "Index ETFs"],
  riskProfile:         "moderate",
  botActive:           true,
  maxPositions:        10,
  autoCompound:        true,
  stopLossOverride:    0,
  updatedAt:           new Date().toISOString(),
};

const KEY = "ggai_bot_config";

export function getBotConfig(): BotConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveBotConfig(config: Partial<BotConfig>): BotConfig {
  const current = getBotConfig();
  const updated: BotConfig = { ...current, ...config, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(updated));
  // Also sync into ggai_user so other pages pick it up
  try {
    const raw = localStorage.getItem("ggai_user");
    if (raw) {
      const user = JSON.parse(raw);
      localStorage.setItem("ggai_user", JSON.stringify({
        ...user,
        riskProfile: updated.riskProfile,
        botActive: updated.botActive,
        botConfig: updated,
      }));
    }
  } catch {}
  return updated;
}

export function getActiveSymbols(universe: AssetGroup[]): string[] {
  return universe.flatMap(g => ASSET_SYMBOLS[g] ?? []);
}

export function nextRebalanceDate(freq: RebalanceFrequency): string {
  if (freq === "One-time") return "Pending trigger";
  if (freq === "Manual")   return "On demand";
  const d = new Date();
  if (freq === "Daily")     d.setDate(d.getDate() + 1);
  if (freq === "Weekly")    d.setDate(d.getDate() + 7);
  if (freq === "Bi-weekly") d.setDate(d.getDate() + 14);
  if (freq === "Monthly")   d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function estimateTradesPerWeek(threshold: number, universe: AssetGroup[]): [number, number] {
  const n      = getActiveSymbols(universe).length;
  const factor = (100 - threshold) / 10;
  const base   = n * factor * 0.32;
  return [Math.round(base * 0.7), Math.round(base * 1.4)];
}
