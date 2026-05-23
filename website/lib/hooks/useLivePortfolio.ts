"use client";
import { useState, useEffect } from "react";

export type LivePosition = {
  sym: string; qty: number; entry: number; current: number;
  pl: number; plPct: number; value: number;
};

export type PortfolioData = {
  connected: boolean; paper: boolean;
  portfolio_value: number; buying_power: number; cash: number;
  positions: LivePosition[];
  recent_orders: any[];
};

export function useLivePortfolio(intervalMs = 15000) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const key    = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_key")    ?? "") : "";
    const secret = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_secret") ?? "") : "";
    const paper  = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_paper") !== "false") : true;

    if (!key || !secret) { setLoading(false); return; }

    const load = async () => {
      try {
        const res = await fetch("/api/bot/status", {
          headers: { "x-alpaca-key": key, "x-alpaca-secret": secret, "x-alpaca-paper": String(paper) },
        });
        if (res.ok) {
          const raw = await res.json();
          // Normalize positions from API shape to dashboard shape
          const positions: LivePosition[] = (raw.positions ?? []).map((p: any) => ({
            sym:     p.symbol,
            qty:     parseFloat(p.qty),
            entry:   parseFloat(p.avg_entry_price),
            current: parseFloat(p.current_price),
            pl:      parseFloat(p.unrealized_pl),
            plPct:   parseFloat(p.unrealized_plpc) * 100,
            value:   parseFloat(p.market_value),
          }));
          setPortfolio({
            connected:       raw.connected,
            paper:           raw.mode === "paper",
            portfolio_value: raw.equity ?? raw.portfolio_value ?? 0,
            buying_power:    raw.buying_power ?? 0,
            cash:            raw.cash ?? 0,
            positions,
            recent_orders:   raw.recent_orders ?? [],
          });
        }
        setLoading(false);
      } catch { setLoading(false); }
    };

    load();
    const iv = setInterval(load, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return { portfolio, loading };
}
