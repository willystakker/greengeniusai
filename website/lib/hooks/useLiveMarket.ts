"use client";
import { useState, useEffect } from "react";

export type MarketData = {
  indices:   Array<{ sym: string; name: string; price: number; change: number; changePct: number }>;
  sectors:   Array<{ sym: string; name: string; changePct: number }>;
  fearGreed: number;
  vix:       number;
  updatedAt: string;
};

export function useLiveMarket(intervalMs = 30000) {
  const [market,  setMarket]  = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market");
        if (res.ok) { setMarket(await res.json()); setLoading(false); }
      } catch {}
    };
    load();
    const iv = setInterval(load, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return { market, loading };
}
