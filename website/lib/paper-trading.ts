// Paper trading engine — all state stored in localStorage (no broker needed)

export type PaperPosition = {
  sym: string;
  shares: number;
  avgEntry: number;
  totalCost: number;
};

export type PaperTrade = {
  id: string;
  sym: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  reason?: string;
  confidence?: number;
};

export type PaperPortfolio = {
  cash: number;
  deposited: number;
  positions: Record<string, PaperPosition>;
  trades: PaperTrade[];
};

const KEY = "ggai_paper_portfolio";
const DEFAULT_BALANCE = 10000;

export function loadPaperPortfolio(): PaperPortfolio {
  if (typeof window === "undefined") {
    return { cash: DEFAULT_BALANCE, deposited: DEFAULT_BALANCE, positions: {}, trades: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PaperPortfolio;
  } catch {}
  return { cash: DEFAULT_BALANCE, deposited: DEFAULT_BALANCE, positions: {}, trades: [] };
}

function save(p: PaperPortfolio) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function addVirtualFunds(amount: number): PaperPortfolio {
  const p = loadPaperPortfolio();
  p.cash = +(p.cash + amount).toFixed(2);
  p.deposited = +(p.deposited + amount).toFixed(2);
  save(p);
  return p;
}

export function executePaperTrade(
  sym: string,
  side: "buy" | "sell",
  dollarAmount: number,
  price: number,
  reason?: string,
  confidence?: number,
): { success: boolean; error?: string; portfolio: PaperPortfolio } {
  const p = loadPaperPortfolio();
  const shares = +(dollarAmount / price).toFixed(6);
  const total = +(shares * price).toFixed(2);

  if (side === "buy") {
    if (p.cash < total) return { success: false, error: "Insufficient funds", portfolio: p };
    p.cash = +(p.cash - total).toFixed(2);
    const pos = p.positions[sym] ?? { sym, shares: 0, avgEntry: 0, totalCost: 0 };
    const newTotalCost = pos.totalCost + total;
    const newShares = +(pos.shares + shares).toFixed(6);
    pos.avgEntry = +(newTotalCost / newShares).toFixed(4);
    pos.shares = newShares;
    pos.totalCost = +newTotalCost.toFixed(2);
    p.positions[sym] = pos;
  } else {
    const pos = p.positions[sym];
    if (!pos || pos.shares < shares - 0.000001) {
      return { success: false, error: "Insufficient shares", portfolio: p };
    }
    p.cash = +(p.cash + total).toFixed(2);
    pos.shares = +(pos.shares - shares).toFixed(6);
    pos.totalCost = +(pos.shares * pos.avgEntry).toFixed(2);
    if (pos.shares <= 0.000001) {
      delete p.positions[sym];
    } else {
      p.positions[sym] = pos;
    }
  }

  p.trades.unshift({
    id: `${Date.now()}-${sym}`,
    sym, side, shares, price, total,
    timestamp: new Date().toISOString(),
    reason, confidence,
  });
  p.trades = p.trades.slice(0, 200);

  save(p);
  return { success: true, portfolio: p };
}

export function resetPaperPortfolio(): PaperPortfolio {
  const p: PaperPortfolio = { cash: DEFAULT_BALANCE, deposited: DEFAULT_BALANCE, positions: {}, trades: [] };
  save(p);
  return p;
}
