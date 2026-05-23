import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_PATH = path.join("C:\\Users\\jaden\\GreenGenius-Bot\\greengenius.log");

export async function GET() {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return NextResponse.json({ trades: [], status: "Bot log not found" });
    }

    const raw   = fs.readFileSync(LOG_PATH, "utf-8");
    const lines = raw.trim().split("\n").reverse(); // newest first

    const trades: any[] = [];
    const statusLines: string[] = [];

    for (const line of lines) {
      // Parse BUY trades: "2026-05-22 10:30:00,000  INFO  BUY  AAPL  $24.00  |  Balance: $112.50"
      const buyMatch = line.match(
        /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*BUY\s+(\w+)\s+\$([0-9.]+).*Balance:\s*\$([0-9.]+)/
      );
      if (buyMatch) {
        trades.push({
          time:    buyMatch[1],
          side:    "BUY",
          symbol:  buyMatch[2],
          amount:  parseFloat(buyMatch[3]),
          balance: parseFloat(buyMatch[4]),
        });
        continue;
      }

      // Parse SELL trades: "2026-05-22 10:45:00,000  INFO  SELL AAPL  qty=0.12  reason=Take profit +8.0%  |  Balance: $118.20"
      const sellMatch = line.match(
        /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*SELL\s+(\w+).*reason=([^|]+).*Balance:\s*\$([0-9.]+)/
      );
      if (sellMatch) {
        trades.push({
          time:    sellMatch[1],
          side:    "SELL",
          symbol:  sellMatch[2],
          reason:  sellMatch[3].trim(),
          balance: parseFloat(sellMatch[4]),
        });
        continue;
      }

      // Grab recent status lines for activity feed
      if (statusLines.length < 20 && line.includes("INFO")) {
        statusLines.push(line);
      }
    }

    // Get last known balance from most recent trade or log
    const balanceMatch = lines.slice(0, 30).join("\n").match(/Balance:\s*\$([0-9.]+)/);
    const lastBalance  = balanceMatch ? parseFloat(balanceMatch[1]) : null;

    // Get universe size
    const universeMatch = raw.match(/Universe ready:\s*(\d+)/);
    const universeSize  = universeMatch ? parseInt(universeMatch[1]) : 0;

    // Get batch scanned count
    const batchMatches = raw.match(/Scanning batch of (\d+)/g) ?? [];
    const batchesRun   = batchMatches.length;
    const stocksScanned = batchesRun * 100;

    return NextResponse.json({
      trades:        trades.slice(0, 20),
      recent_log:    statusLines.slice(0, 10),
      last_balance:  lastBalance,
      universe_size: universeSize,
      stocks_scanned: stocksScanned,
      batches_run:   batchesRun,
    });
  } catch (err: any) {
    return NextResponse.json({ trades: [], error: err.message });
  }
}
