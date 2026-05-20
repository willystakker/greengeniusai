/**
 * GET /api/bot/status
 * Returns live portfolio data from Alpaca for the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAccount, getPositions, getOrders } from "@/lib/alpaca";

export async function GET(req: NextRequest) {
  const key    = req.headers.get("x-alpaca-key")    ?? process.env.ALPACA_API_KEY    ?? "";
  const secret = req.headers.get("x-alpaca-secret") ?? process.env.ALPACA_API_SECRET ?? "";
  const paper  = (req.headers.get("x-alpaca-paper") ?? process.env.ALPACA_PAPER ?? "true") !== "false";

  if (!key || !secret || key.length < 5) {
    return NextResponse.json({ connected: false, reason: "No Alpaca credentials configured" });
  }

  try {
    const [account, positions, orders] = await Promise.all([
      getAccount(alpacaKey(key), alpacaSecret(secret), paper),
      getPositions(alpacaKey(key), alpacaSecret(secret), paper),
      getOrders(alpacaKey(key), alpacaSecret(secret), paper, 20),
    ]);

    const totalGain = positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0);

    return NextResponse.json({
      connected:      true,
      paper,
      portfolio_value: parseFloat(account.portfolio_value),
      buying_power:    parseFloat(account.buying_power),
      cash:            parseFloat(account.cash),
      total_gain:      +totalGain.toFixed(2),
      positions:       positions.map(p => ({
        sym:       p.symbol.replace("/USD",""),
        qty:       p.qty,
        entry:     parseFloat(p.avg_entry_price),
        current:   parseFloat(p.current_price),
        pl:        parseFloat(p.unrealized_pl),
        plPct:     +(parseFloat(p.unrealized_plpc) * 100).toFixed(2),
        value:     parseFloat(p.market_value),
      })),
      recent_orders: orders.slice(0, 10).map(o => ({
        sym:    o.symbol.replace("/USD",""),
        side:   o.side,
        status: o.status,
        price:  o.filled_avg_price ? parseFloat(o.filled_avg_price) : null,
        time:   o.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, reason: err.message }, { status: 200 });
  }
}

// Helpers to avoid passing undefined
function alpacaKey(k: string)    { return k; }
function alpacaSecret(s: string) { return s; }
