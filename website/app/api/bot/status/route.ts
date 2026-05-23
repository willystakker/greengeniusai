import { NextRequest, NextResponse } from "next/server";
import { getAccount, getPositions, getOrders } from "@/lib/alpaca";
import { getBotConfig } from "@/lib/bot-config";

export async function GET(req: NextRequest) {
  const alpacaKey    = (req.headers.get("x-alpaca-key")    ?? "").trim();
  const alpacaSecret = (req.headers.get("x-alpaca-secret") ?? "").trim();
  const alpacaPaper  = req.headers.get("x-alpaca-paper")   !== "false";

  const hasAlpaca = alpacaKey.length > 4 && alpacaSecret.length > 4;

  if (!hasAlpaca) {
    const cfg = getBotConfig();
    return NextResponse.json({
      mode:      "local",
      active:    cfg.botActive ?? true,
      connected: false,
    });
  }

  try {
    const [account, positions, orders] = await Promise.all([
      getAccount(alpacaKey, alpacaSecret, alpacaPaper),
      getPositions(alpacaKey, alpacaSecret, alpacaPaper),
      getOrders(alpacaKey, alpacaSecret, alpacaPaper, 20),
    ]);

    return NextResponse.json({
      mode:            alpacaPaper ? "paper" : "live",
      active:          true,
      connected:       true,
      account_status:  account.status,
      portfolio_value: parseFloat(account.portfolio_value),
      buying_power:    parseFloat(account.buying_power),
      cash:            parseFloat(account.cash),
      equity:          parseFloat(account.equity),
      positions:       positions.map(p => ({
        symbol:          p.symbol,
        qty:             parseFloat(p.qty),
        avg_entry_price: parseFloat(p.avg_entry_price),
        current_price:   parseFloat(p.current_price),
        unrealized_pl:   parseFloat(p.unrealized_pl),
        unrealized_plpc: parseFloat(p.unrealized_plpc),
        market_value:    parseFloat(p.market_value),
        side:            p.side,
      })),
      recent_orders: orders.slice(0, 10).map(o => ({
        id:               o.id,
        symbol:           o.symbol,
        side:             o.side,
        qty:              o.qty,
        notional:         o.notional,
        status:           o.status,
        filled_avg_price: o.filled_avg_price,
        created_at:       o.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({
      mode:      "error",
      active:    false,
      connected: false,
      error:     err.message,
    });
  }
}
