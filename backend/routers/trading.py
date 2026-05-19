"""Trading router — AI analysis, trade execution, trade history."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.ai_trader import AITradingEngine
from services.alpaca_service import AlpacaService

router = APIRouter()
ai_engine = AITradingEngine()
broker = AlpacaService()


class AnalyzeRequest(BaseModel):
    ticker: str
    risk_profile: str = "moderate"
    portfolio_context: Optional[dict] = None


class ExecuteTradeRequest(BaseModel):
    user_id: str
    ticker: str
    action: str
    notional: float
    stop_loss: Optional[float] = None


@router.post("/analyze")
async def analyze_asset(req: AnalyzeRequest):
    """Run full AI analysis on any asset."""
    try:
        decision = await ai_engine.analyze_asset(
            ticker=req.ticker,
            user_risk_profile=req.risk_profile,
            portfolio_context=req.portfolio_context,
        )
        return decision
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_trade(req: ExecuteTradeRequest):
    """Execute a trade (called by AI engine or manual user action)."""
    try:
        result = await broker.place_order(
            user_id=req.user_id,
            ticker=req.ticker,
            action=req.action,
            notional=req.notional,
            stop_loss=req.stop_loss,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{user_id}")
async def get_portfolio(user_id: str):
    """Get user's live portfolio from Alpaca."""
    try:
        return await broker.get_portfolio(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rebalance")
async def rebalance_portfolio(portfolio: dict, risk_profile: str = "moderate"):
    """Generate AI rebalance recommendations."""
    try:
        result = await ai_engine.generate_portfolio_rebalance(
            portfolio=portfolio,
            risk_profile=risk_profile,
            market_context="current",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/{event}")
async def explain_event(event: str):
    """AI plain-English explanation of any market event."""
    try:
        explanation = await ai_engine.explain_market_event(event)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
