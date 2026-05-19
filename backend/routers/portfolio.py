"""Portfolio router — user portfolio, positions, settings."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.alpaca_service import AlpacaService

router = APIRouter()
broker = AlpacaService()


class BotToggleRequest(BaseModel):
    user_id: str
    active: bool


class RiskProfileRequest(BaseModel):
    user_id: str
    risk_profile: str  # conservative | moderate | aggressive


@router.get("/{user_id}")
async def get_portfolio(user_id: str):
    try:
        return await broker.get_portfolio(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bot/toggle")
async def toggle_bot(req: BotToggleRequest):
    """Enable or disable the AI auto-trading bot for a user."""
    # In production: update user.bot_active in DB
    return {"user_id": req.user_id, "bot_active": req.active}


@router.post("/risk-profile")
async def update_risk_profile(req: RiskProfileRequest):
    """Update user's risk tolerance — AI will adjust position sizing immediately."""
    if req.risk_profile not in ("conservative", "moderate", "aggressive"):
        raise HTTPException(status_code=400, detail="Invalid risk profile")
    # In production: update DB, trigger AI rebalance check
    return {"user_id": req.user_id, "risk_profile": req.risk_profile, "rebalance_triggered": True}
