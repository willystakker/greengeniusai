"""
GreenGeniusAI — FastAPI Backend
Handles auth, subscriptions, AI trading engine, market data, and portfolio management.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

from routers import auth, portfolio, trading, subscription, webhooks
from services.ai_trader import AITradingEngine
from services.market_data import MarketDataService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
ai_engine = AITradingEngine()
market_service = MarketDataService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("GreenGeniusAI backend starting...")
    await market_service.start()

    # Schedule AI trading scans every 5 minutes during market hours
    scheduler.add_job(
        ai_engine.run_market_scan,
        "cron",
        day_of_week="mon-fri",
        hour="9-16",
        minute="*/5",
        id="market_scan",
    )
    # After-hours analysis at 6 PM ET
    scheduler.add_job(
        ai_engine.run_afterhours_analysis,
        "cron",
        day_of_week="mon-fri",
        hour=18,
        minute=0,
        id="afterhours_analysis",
    )
    # Crypto runs 24/7 — scan every 10 minutes
    scheduler.add_job(
        ai_engine.run_crypto_scan,
        "interval",
        minutes=10,
        id="crypto_scan",
    )
    scheduler.start()
    logger.info("Scheduler started. AI engine live.")

    yield

    # Shutdown
    scheduler.shutdown()
    await market_service.stop()
    logger.info("GreenGeniusAI backend shut down.")


app = FastAPI(
    title="GreenGeniusAI API",
    description="The world's smartest AI investment engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://greengeniusai.com",
        "https://www.greengeniusai.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(trading.router, prefix="/trading", tags=["Trading"])
app.include_router(subscription.router, prefix="/subscription", tags=["Subscription"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])


@app.get("/")
async def root():
    return {"status": "GreenGeniusAI API online", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "ai_engine": "active",
        "market_feed": await market_service.get_status(),
        "scheduler": scheduler.running,
    }
