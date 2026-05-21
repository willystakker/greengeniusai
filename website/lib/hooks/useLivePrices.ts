"use client";
import { useState, useEffect } from "react";

export type PriceData = {
  sym: string;
  price: string;
  priceNum: number;
  change: string;
  changePct: number;
  up: boolean;
};

export type PriceMap = Record<string, PriceData>;

export function useLivePrices(intervalMs = 20000) {
  const [prices, setPrices]           = useState<PriceMap>({});
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse]             = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data: Array<{ sym: string; price: string; change: string; up: boolean }> = await res.json();
        const map: PriceMap = {};
        for (const d of data) {
          const priceNum  = parseFloat(d.price.replace(/,/g, ""));
          const changePct = parseFloat(d.change.replace(/[+%]/g, ""));
          map[d.sym] = { ...d, priceNum, changePct };
        }
        setPrices(map);
        setLastUpdated(new Date());
        setLoading(false);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } catch {}
    };
    load();
    const iv = setInterval(load, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return { prices, loading, lastUpdated, pulse };
}
