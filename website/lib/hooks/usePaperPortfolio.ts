"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadPaperPortfolio, addVirtualFunds, executePaperTrade,
  resetPaperPortfolio, type PaperTrade,
} from "@/lib/paper-trading";

export type LivePaperPosition = {
  sym: string;
  shares: number;
  avgEntry: number;
  totalCost: number;
  currentPrice: number;
  value: number;
  pl: number;
  plPct: number;
};

export type PaperPortfolioState = {
  cash: number;
  deposited: number;
  positions: LivePaperPosition[];
  trades: PaperTrade[];
  totalValue: number;
  totalPl: number;
  totalPlPct: number;
  loading: boolean;
};

export function usePaperPortfolio(refreshMs = 30000) {
  const [state, setState] = useState<PaperPortfolioState>({
    cash: 10000, deposited: 10000,
    positions: [], trades: [],
    totalValue: 10000, totalPl: 0, totalPlPct: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    // Check for Alpaca keys — if present, fetch real portfolio data
    const alpacaKey    = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_key")    ?? "") : "";
    const alpacaSecret = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_secret") ?? "") : "";
    const alpacaPaper  = typeof window !== "undefined" ? (localStorage.getItem("ggai_alpaca_paper")  !== "false") : true;
    const hasAlpaca    = alpacaKey.length > 4 && alpacaSecret.length > 4;

    if (hasAlpaca) {
      try {
        const res  = await fetch("/api/bot/status", {
          headers: {
            "x-alpaca-key":    alpacaKey,
            "x-alpaca-secret": alpacaSecret,
            "x-alpaca-paper":  String(alpacaPaper),
          },
        });
        const data = await res.json();
        if (data.connected) {
          const alpacaPositions: LivePaperPosition[] = (data.positions ?? []).map((p: any) => {
            const value = p.market_value;
            const pl    = p.unrealized_pl;
            const plPct = +(p.unrealized_plpc * 100).toFixed(2);
            return {
              sym:          p.symbol,
              shares:       p.qty,
              avgEntry:     p.avg_entry_price,
              totalCost:    +(p.qty * p.avg_entry_price).toFixed(2),
              currentPrice: p.current_price,
              value,
              pl,
              plPct,
            };
          });
          const posValue   = alpacaPositions.reduce((s, p) => s + p.value, 0);
          const totalValue = +(data.cash + posValue).toFixed(2);
          const deposited  = totalValue; // Alpaca doesn't track deposits — use current value as baseline
          setState({
            cash:       data.cash,
            deposited,
            positions:  alpacaPositions,
            trades:     [],
            totalValue,
            totalPl:    data.equity - data.portfolio_value, // unrealized total
            totalPlPct: 0,
            loading:    false,
          });
          return;
        }
      } catch {
        // fall through to paper portfolio
      }
    }

    // Paper portfolio fallback
    const portfolio = loadPaperPortfolio();
    const syms = Object.keys(portfolio.positions);
    let prices: Record<string, { price: number }> = {};

    if (syms.length > 0) {
      try {
        const r = await fetch(`/api/price?syms=${syms.join(",")}`);
        const d = await r.json();
        prices = d.prices ?? {};
      } catch {}
    }

    const livePositions: LivePaperPosition[] = Object.values(portfolio.positions).map(pos => {
      const currentPrice = prices[pos.sym]?.price ?? pos.avgEntry;
      const value = +(pos.shares * currentPrice).toFixed(2);
      const pl = +(value - pos.totalCost).toFixed(2);
      const plPct = pos.totalCost > 0 ? +((pl / pos.totalCost) * 100).toFixed(2) : 0;
      return { ...pos, currentPrice, value, pl, plPct };
    });

    const posValue = livePositions.reduce((s, p) => s + p.value, 0);
    const totalValue = +(portfolio.cash + posValue).toFixed(2);
    const totalPl = +(totalValue - portfolio.deposited).toFixed(2);
    const totalPlPct = portfolio.deposited > 0 ? +((totalPl / portfolio.deposited) * 100).toFixed(2) : 0;

    setState({
      cash: portfolio.cash,
      deposited: portfolio.deposited,
      positions: livePositions,
      trades: portfolio.trades,
      totalValue, totalPl, totalPlPct,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, refreshMs);
    return () => clearInterval(iv);
  }, [refresh, refreshMs]);

  const deposit = useCallback((amount: number) => {
    addVirtualFunds(amount);
    refresh();
  }, [refresh]);

  const trade = useCallback((
    sym: string, side: "buy" | "sell", dollarAmount: number, price: number,
    reason?: string, confidence?: number,
  ) => {
    const result = executePaperTrade(sym, side, dollarAmount, price, reason, confidence);
    refresh();
    return result;
  }, [refresh]);

  const reset = useCallback(() => {
    resetPaperPortfolio();
    refresh();
  }, [refresh]);

  return { ...state, refresh, deposit, trade, reset };
}
