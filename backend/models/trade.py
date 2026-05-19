"""Trade data models."""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TradeAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    WATCH = "WATCH"


class AssetClass(str, Enum):
    STOCK = "stock"
    ETF = "etf"
    CRYPTO = "crypto"


class TradeDecision(BaseModel):
    ticker: str
    action: TradeAction
    asset_class: AssetClass = AssetClass.STOCK
    confidence: int  # 0-100
    position_size_pct: float  # % of portfolio
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target_price: Optional[float] = None
    time_horizon: str = "swing"
    reasoning: str
    risk_factors: list[str] = []
    signals: dict = {}
    timestamp: str = ""
    ai_model: str = ""
