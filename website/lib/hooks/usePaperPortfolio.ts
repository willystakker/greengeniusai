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
  mode: "alpaca-live" | "alpaca-paper" | "local";
  alpacaConnected: boolean;
};

function getAlpacaKeys() {
  if (typeof window === "undefined") return { key: "", secret: "", paper: true };
  return {
    key:    localStorage.getItem("ggai_alpaca_key")    ?? "",
    secret: localStorage.getItem("ggai_alpaca_secret") ?? "",
    paper:  localStorage.getItem("ggai_alpaca_paper")  !== "false",
  };
}

export function usePaperPortfolio(refreshMs = 30000) {
  const [state, setState] = useState<PaperPortfolioState>({
    cash: 0, deposited: 0,
    positions: [], trades: [],
    totalValue: 0, totalPl: 0, totalPlPct: 0,
    loading: true,
    mode: "local",
    alpacaConnected: false,
  });

  const refresh = useCallback(async () => {
    const { key, secret, paper } = getAlpacaKeys();
    const hasAlpaca = key.length > 4 && secret.length > 4;

    // ── Alpaca live/paper mode ────────────────────────────────────────────────
    if (hasAlpaca) {
      try {
        const res  = await fetch("/api/bot/status", {
          headers: {
            "x-alpaca-key":    key,
            "x-alpaca-secret": secret,
            "x-alpaca-paper":  String(paper),
          },
        });
        const data = await res.json();

        if (data.connected) {
          const alpacaPositions: LivePaperPosition[] = (data.positions ?? []).map((p: any) => ({
            sym:          p.symbol,
            shares:       p.qty,
            avgEntry:     p.avg_entry_price,
            totalCost:    +(p.qty * p.avg_entry_price).toFixed(2),
            currentPrice: p.current_price,
            value:        p.market_value,
            pl:           p.unrealized_pl,
            plPct:        +(p.unrealized_plpc * 100).toFixed(2),
          }));

          const posValue   = alpacaPositions.reduce((s, p) => s + p.value, 0);
          const totalValue = +(data.cash + posValue).toFixed(2);
          const equity     = data.equity ?? totalValue;
          const deposited  = equity; // baseline = current equity
          const totalPl    = +(equity - data.portfolio_value).toFixed(2);

          setState({
            cash:            data.cash,
            deposited,
            positions:       alpacaPositions,
            trades:          [],
            totalValue:      parseFloat(data.portfolio_value) || totalValue,
            totalPl,
            totalPlPct:      0,
            loading:         false,
            mode:            paper ? "alpaca-paper" : "alpaca-live",
            alpacaConnected: true,
          });
          return;
        }
      } catch {
        // fall through to local mode
      }
    }

    // ── Local paper portfolio ─────────────────────────────────────────────────
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
      const value  = +(pos.shares * currentPrice).toFixed(2);
      const pl     = +(value - pos.totalCost).toFixed(2);
      const plPct  = pos.totalCost > 0 ? +((pl / pos.totalCost) * 100).toFixed(2) : 0;
      return { ...pos, currentPrice, value, pl, plPct };
    });

    const posValue   = livePositions.reduce((s, p) => s + p.value, 0);
    const totalValue = +(portfolio.cash + posValue).toFixed(2);
    const totalPl    = +(totalValue - portfolio.deposited).toFixed(2);
    const totalPlPct = portfolio.deposited > 0 ? +((totalPl / portfolio.deposited) * 100).toFixed(2) : 0;

    setState({
      cash:            portfolio.cash,
      deposited:       portfolio.deposited,
      positions:       livePositions,
      trades:          portfolio.trades,
      totalValue, totalPl, totalPlPct,
      loading:         false,
      mode:            "local",
      alpacaConnected: false,
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
