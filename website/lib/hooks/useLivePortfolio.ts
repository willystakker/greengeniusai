"use client";
import { useState, useEffect } from "react";

export type LivePosition = {
  sym: string; qty: string; entry: number; current: number;
  pl: number; plPct: number; value: number;
};

export type LiveOrder = {
  sym: string; side: string; status: string; price: number | null; time: string;
};

export type PortfolioData = {
  connected: boolean; paper: boolean;
  portfolio_value?: number; buying_power?: number; cash?: number; total_gain?: number;
  positions?: LivePosition[];
  recent_orders?: LiveOrder[];
};

export function useLivePortfolio(intervalMs = 30000) {
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
        if (res.ok) setPortfolio(await res.json());
        setLoading(false);
      } catch { setLoading(false); }
    };
    load();
    const iv = setInterval(load, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return { portfolio, loading };
}
