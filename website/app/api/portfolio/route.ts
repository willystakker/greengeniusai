import { NextResponse } from "next/server";
import { getAccount, getPositions, getOrders } from "@/lib/alpaca";

export async function GET() {
  const key    = process.env.ALPACA_API_KEY    ?? "";
  const secret = process.env.ALPACA_SECRET_KEY ?? "";
  const paper  = process.env.ALPACA_PAPER !== "false";

  if (!key || !secret) {
    return NextResponse.json({ connected: false, error: "Keys not configured" });
  }

  try {
    const [account, positions, orders] = await Promise.all([
      getAccount(key, secret, paper),
      getPositions(key, secret, paper),
      getOrders(key, secret, paper, 20),
    ]);

    return NextResponse.json({
      connected:       true,
      paper,
      equity:          parseFloat(account.equity),
      cash:            parseFloat(account.cash),
      buying_power:    parseFloat(account.buying_power),
      positions: positions.map((p: any) => ({
        symbol:      p.symbol,
        qty:         parseFloat(p.qty),
        entry:       parseFloat(p.avg_entry_price),
        current:     parseFloat(p.current_price),
        pl:          parseFloat(p.unrealized_pl),
        plPct:       parseFloat(p.unrealized_plpc) * 100,
        value:       parseFloat(p.market_value),
      })),
      orders: orders.slice(0, 15).map((o: any) => ({
        symbol:      o.symbol,
        side:        o.side,
        qty:         o.qty,
        notional:    o.notional,
        status:      o.status,
        price:       o.filled_avg_price ? parseFloat(o.filled_avg_price) : null,
        time:        o.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message });
  }
}
