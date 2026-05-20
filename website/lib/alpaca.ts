/**
 * Alpaca Markets client — Phase 4 (EXECUTE) + Phase 5 (MONITOR)
 * Supports both paper trading and live trading.
 * Set ALPACA_PAPER=true for safe testing, false for real money.
 */

export type AlpacaOrder = {
  id:         string;
  symbol:     string;
  side:       "buy" | "sell";
  qty?:       string;
  notional?:  string;
  status:     string;
  filled_avg_price?: string;
  created_at: string;
};

export type AlpacaPosition = {
  symbol:          string;
  qty:             string;
  avg_entry_price: string;
  current_price:   string;
  unrealized_pl:   string;
  unrealized_plpc: string;
  market_value:    string;
  side:            string;
};

export type AlpacaAccount = {
  id:              string;
  portfolio_value: string;
  buying_power:    string;
  cash:            string;
  equity:          string;
  status:          string;
};

function getBase(paper = true) {
  return paper
    ? "https://paper-api.alpaca.markets"
    : "https://api.alpaca.markets";
}

function headers(key: string, secret: string) {
  return {
    "APCA-API-KEY-ID":     key,
    "APCA-API-SECRET-KEY": secret,
    "Content-Type":        "application/json",
  };
}

async function alpacaFetch<T>(
  path: string,
  key: string,
  secret: string,
  paper: boolean,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${getBase(paper)}${path}`, {
    ...options,
    headers: { ...headers(key, secret), ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Alpaca ${options.method ?? "GET"} ${path} → ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export async function getAccount(key: string, secret: string, paper: boolean): Promise<AlpacaAccount> {
  return alpacaFetch("/v2/account", key, secret, paper);
}

export async function getPositions(key: string, secret: string, paper: boolean): Promise<AlpacaPosition[]> {
  return alpacaFetch("/v2/positions", key, secret, paper);
}

export async function getOrders(key: string, secret: string, paper: boolean, limit = 20): Promise<AlpacaOrder[]> {
  return alpacaFetch(`/v2/orders?status=all&limit=${limit}`, key, secret, paper);
}

export async function closePosition(key: string, secret: string, paper: boolean, symbol: string): Promise<AlpacaOrder> {
  return alpacaFetch(`/v2/positions/${symbol}`, key, secret, paper, { method: "DELETE" });
}

export async function placeOrder(
  key:     string,
  secret:  string,
  paper:   boolean,
  symbol:  string,
  side:    "buy" | "sell",
  notional: number,         // USD amount
): Promise<AlpacaOrder> {
  // Crypto symbols need different format on Alpaca
  const isCrypto  = ["BTC","ETH","SOL","BNB","AVAX"].includes(symbol.replace("/USD",""));
  const alpacaSym = isCrypto ? symbol.replace("-USD","") + "/USD" : symbol;

  const body: Record<string, string> = {
    symbol:        alpacaSym,
    side,
    type:          "market",
    time_in_force: isCrypto ? "gtc" : "day",
  };

  // Use notional (dollar amount) for fractional/crypto — minimum $1
  if (notional >= 1) {
    body.notional = notional.toFixed(2);
  } else {
    throw new Error(`Order amount $${notional} below minimum $1`);
  }

  return alpacaFetch("/v2/orders", key, secret, paper, {
    method: "POST",
    body:   JSON.stringify(body),
  });
}

// Check if a symbol has crossed its stop-loss price
export function isStopTriggered(
  position: AlpacaPosition,
  stopLossPct: number   // e.g. 5 means 5%
): boolean {
  const entry   = parseFloat(position.avg_entry_price);
  const current = parseFloat(position.current_price);
  const plPct   = ((current - entry) / entry) * 100;
  return position.side === "long" && plPct <= -Math.abs(stopLossPct);
}
