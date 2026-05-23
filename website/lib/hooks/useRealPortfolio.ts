"use client";
import { useState, useEffect } from "react";

export type RealPosition = {
  sym: string;
  name: string;
  qty: number;
  entry: number;
  current: number;
  pl: number;
  plPct: number;
  value: number;
  color: string;
  class: "Equity" | "Crypto" | "Cash";
};

export type RealOrder = {
  id: string;
  sym: string;
  side: "buy" | "sell";
  qty: number;
  price: number | null;
  notional: number | null;
  status: string;
  time: string;
};

export type RealPortfolio = {
  connected: boolean;
  loading: boolean;
  equity: number;
  cash: number;
  buyingPower: number;
  positions: RealPosition[];
  orders: RealOrder[];
  totalPl: number;
  totalPlPct: number;
};

const CRYPTO_SYMS = new Set(["BTC","ETH","SOL","AVAX","DOGE","LINK","BTC/USD","ETH/USD","SOL/USD","AVAX/USD","DOGE/USD","LINK/USD"]);
const COLORS = ["#00FF41","#00D97E","#7FFF00","#00BCD4","#FFD700","#FF6B6B","#C084FC","#38BDF8","#F59E0B","#34D399"];

function assetClass(sym: string): "Equity" | "Crypto" {
  return CRYPTO_SYMS.has(sym) || sym.includes("/USD") ? "Crypto" : "Equity";
}

function cleanSym(sym: string) {
  return sym.replace("/USD", "").replace("USD", "");
}

export function useRealPortfolio(intervalMs = 15000): RealPortfolio {
  const [data, setData] = useState<RealPortfolio>({
    connected: false, loading: true,
    equity: 0, cash: 0, buyingPower: 0,
    positions: [], orders: [], totalPl: 0, totalPlPct: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/portfolio");
        if (!r.ok) { setData(d => ({ ...d, loading: false })); return; }
        const raw = await r.json();
        if (!raw.connected) { setData(d => ({ ...d, loading: false, connected: false })); return; }

        const positions: RealPosition[] = (raw.positions ?? []).map((p: any, i: number) => ({
          sym:     cleanSym(p.symbol),
          name:    p.symbol,
          qty:     parseFloat(p.qty),
          entry:   parseFloat(p.entry ?? p.avg_entry_price ?? 0),
          current: parseFloat(p.current ?? p.current_price ?? 0),
          pl:      parseFloat(p.pl ?? p.unrealized_pl ?? 0),
          plPct:   parseFloat(p.plPct ?? (p.unrealized_plpc ? p.unrealized_plpc * 100 : 0)),
          value:   parseFloat(p.value ?? p.market_value ?? 0),
          color:   COLORS[i % COLORS.length],
          class:   assetClass(p.symbol),
        }));

        const orders: RealOrder[] = (raw.orders ?? []).map((o: any) => ({
          id:       o.id ?? String(Math.random()),
          sym:      cleanSym(o.symbol ?? ""),
          side:     (o.side ?? "buy") as "buy" | "sell",
          qty:      parseFloat(o.qty ?? o.notional ?? 0),
          price:    o.price ? parseFloat(o.price) : null,
          notional: o.notional ? parseFloat(o.notional) : null,
          status:   o.status ?? "unknown",
          time:     o.time ?? o.created_at ?? "",
        }));

        const totalPl    = positions.reduce((s, p) => s + p.pl, 0);
        const START      = 100;
        const totalPlPct = ((raw.equity - START) / START) * 100;

        setData({
          connected: true, loading: false,
          equity: raw.equity ?? 0,
          cash: raw.cash ?? 0,
          buyingPower: raw.buying_power ?? 0,
          positions, orders, totalPl, totalPlPct,
        });
      } catch {
        setData(d => ({ ...d, loading: false }));
      }
    };

    load();
    const iv = setInterval(load, intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);

  return data;
}
