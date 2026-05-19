"""
GreenGeniusAI — Stripe Subscription Service
Manages $8.99/month subscriptions with 7-day free trial.
"""

import os
import stripe
import logging

logger = logging.getLogger(__name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")  # Create this in Stripe dashboard


class StripeService:

    @staticmethod
    async def create_customer(email: str, name: str) -> str:
        """Create a Stripe customer and return customer_id."""
        customer = stripe.Customer.create(email=email, name=name)
        return customer.id

    @staticmethod
    async def create_subscription(customer_id: str) -> dict:
        """Create $8.99/month subscription with 7-day free trial."""
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": PRICE_ID}],
            trial_period_days=7,
            payment_behavior="default_incomplete",
            payment_settings={"save_default_payment_method": "on_subscription"},
            expand=["latest_invoice.payment_intent"],
        )
        return {
            "subscription_id": subscription.id,
            "status": subscription.status,
            "trial_end": subscription.trial_end,
            "client_secret": subscription.latest_invoice.payment_intent.client_secret
            if subscription.latest_invoice and subscription.latest_invoice.payment_intent
            else None,
        }

    @staticmethod
    async def create_portal_session(customer_id: str, return_url: str) -> str:
        """Generate a Stripe Customer Portal URL for self-service billing."""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session.url

    @staticmethod
    async def cancel_subscription(subscription_id: str) -> dict:
        """Cancel at period end (not immediately — user keeps access until billing date)."""
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
        )
        return {"status": subscription.status, "cancel_at": subscription.cancel_at}

    @staticmethod
    async def handle_webhook(payload: bytes, sig_header: str) -> dict:
        """Process Stripe webhooks — critical for subscription lifecycle."""
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid Stripe webhook signature")

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "customer.subscription.created":
            logger.info(f"New subscription: {data['id']}")
            # In production: update user record in DB, send welcome email, activate bot

        elif event_type == "customer.subscription.deleted":
            logger.info(f"Subscription cancelled: {data['id']}")
            # In production: deactivate user's bot, downgrade access

        elif event_type == "invoice.payment_succeeded":
            logger.info(f"Payment succeeded for {data['customer']}")
            # In production: extend subscription, log revenue

        elif event_type == "invoice.payment_failed":
            logger.warning(f"Payment failed for {data['customer']}")
            # In production: send dunning email, pause bot

        elif event_type == "customer.subscription.trial_will_end":
            logger.info(f"Trial ending soon for {data['customer']}")
            # In production: send trial ending reminder email/push

        return {"handled": event_type}
