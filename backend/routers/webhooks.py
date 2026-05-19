"""Webhooks router — Stripe and Alpaca event handlers."""

from fastapi import APIRouter, Request, HTTPException, Header
from services.stripe_service import StripeService

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Stripe webhook endpoint — handles all subscription lifecycle events."""
    payload = await request.body()
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    try:
        result = await StripeService.handle_webhook(payload, stripe_signature)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
