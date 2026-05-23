import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_PATH = path.join("C:\\Users\\jaden\\GreenGenius-Bot\\greengenius.log");

export async function GET() {
  try {
    let batchesRun = 0;
    let stocksScanned = 0;
    let universeSize = 0;
    let recentSignals: any[] = [];
    let logActive = false;
    let lastLine = "";

    if (fs.existsSync(LOG_PATH)) {
      const raw = fs.readFileSync(LOG_PATH, "utf-8");
      const lines = raw.trim().split("\n");
      logActive = true;

      const universeMatch = raw.match(/Universe:\s*([\d,]+)\s*stocks/);
      universeSize = universeMatch ? parseInt(universeMatch[1].replace(",", "")) : 6843;

      const batchMatches = raw.match(/Scanning batch of \d+/g) ?? [];
      batchesRun = batchMatches.length;
      stocksScanned = batchesRun * 100;

      // Grab last few lines for activity
      lastLine = lines[lines.length - 1] ?? "";

      // Parse signals (BUY/SELL events)
      for (const line of lines.slice(-200).reverse()) {
        if (recentSignals.length >= 10) break;
        const buyMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*BUY\s+(\w+)\s+\$([0-9.]+)/);
        const sellMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*SELL\s+(\w+)/);
        if (buyMatch) recentSignals.push({ time: buyMatch[1], action: "BUY", symbol: buyMatch[2], amount: parseFloat(buyMatch[3]) });
        else if (sellMatch) recentSignals.push({ time: sellMatch[1], action: "SELL", symbol: sellMatch[2] });
      }
    }

    return NextResponse.json({
      logActive,
      universeSize: universeSize || 6843,
      batchesRun,
      stocksScanned,
      recentSignals,
      lastLine,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      logActive: false,
      universeSize: 6843,
      batchesRun: 0,
      stocksScanned: 0,
      recentSignals: [],
      lastLine: "",
      serverTime: new Date().toISOString(),
      error: err.message,
    });
  }
}
