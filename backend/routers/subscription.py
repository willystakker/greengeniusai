"""Subscription router — Stripe billing management."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from services.stripe_service import StripeService

router = APIRouter()


class CreateSubscriptionRequest(BaseModel):
    customer_id: str


class PortalRequest(BaseModel):
    customer_id: str
    return_url: str


@router.post("/create")
async def create_subscription(req: CreateSubscriptionRequest):
    try:
        return await StripeService.create_subscription(req.customer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portal")
async def billing_portal(req: PortalRequest):
    try:
        url = await StripeService.create_portal_session(req.customer_id, req.return_url)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plans")
async def get_plans():
    return {
        "plans": [{
            "id": "genius",
            "name": "GreenGeniusAI Genius",
            "price": 8.99,
            "currency": "usd",
            "interval": "month",
            "trial_days": 7,
            "features": [
                "Full AI auto-investing engine",
                "Live market data & alerts",
                "Trade reasoning on every decision",
                "Bot on/off manual mode",
                "All asset classes (stocks, ETFs, crypto)",
                "Risk profile customization",
                "Portfolio analytics dashboard",
            ],
        }]
    }
