"""
GreenGeniusAI — AI Trading Engine
Powered by Claude claude-opus-4-7. This is the brain of the entire platform.
It analyzes market data, detects opportunities, executes trades, and explains every decision.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
import anthropic
from services.market_data import MarketDataService
from services.alpaca_service import AlpacaService
from models.trade import TradeDecision, TradeAction, AssetClass

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are GreenGeniusAI's elite trading intelligence. You are among the most sophisticated financial AI systems ever built.

Your core directives:
1. PROTECT CAPITAL FIRST — never risk more than the user's defined risk tolerance per trade
2. IDENTIFY momentum early — catch breakouts before they become mainstream
3. EXIT before declines — use momentum deterioration, volume divergence, and macro signals
4. EXPLAIN every decision in plain English — transparency is non-negotiable
5. THINK like a hedge fund + quantitative analyst + macroeconomist simultaneously

You have access to:
- Real-time price and volume data
- Technical indicators (RSI, MACD, Bollinger Bands, Moving Averages, ATR)
- Options flow and dark pool data signals
- Social sentiment scores (Reddit, Twitter, news)
- Insider transaction filings
- Earnings estimates and surprise history
- Macro events calendar (Fed, CPI, earnings dates)
- On-chain crypto metrics (for crypto assets)
- Sector rotation patterns

For each analysis, output a JSON object with this exact structure:
{
  "action": "BUY" | "SELL" | "HOLD" | "WATCH",
  "asset": "TICKER",
  "asset_class": "stock" | "etf" | "crypto",
  "confidence": 0-100,
  "position_size_pct": 0-20,
  "entry_price": float,
  "stop_loss": float,
  "target_price": float,
  "time_horizon": "intraday" | "swing" | "position",
  "reasoning": "Plain-English explanation of exactly why this trade is recommended",
  "risk_factors": ["list of risks the user should know about"],
  "signals": {
    "technical": "summary of technical signals",
    "fundamental": "summary of fundamental signals",
    "sentiment": "summary of sentiment signals",
    "macro": "relevant macro context"
  }
}

Be decisive. Be specific. Be transparent. Never recommend something you wouldn't stake your reputation on."""


class AITradingEngine:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic()
        self.market = MarketDataService()
        self.broker = AlpacaService()
        self.model = "claude-opus-4-7"

    async def analyze_asset(
        self,
        ticker: str,
        user_risk_profile: str = "moderate",
        portfolio_context: Optional[dict] = None,
    ) -> TradeDecision:
        """Run full AI analysis on a single asset and return a trade decision."""
        try:
            # Gather all market intelligence
            market_data = await self.market.get_full_analysis(ticker)

            user_message = f"""
Analyze {ticker} and give me a trade decision right now.

LIVE MARKET DATA:
{json.dumps(market_data, indent=2)}

USER CONTEXT:
- Risk Profile: {user_risk_profile}
- Portfolio: {json.dumps(portfolio_context or {}, indent=2)}

Provide your full analysis and a decisive trade recommendation.
"""
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )

            raw = response.content[0].text
            # Extract JSON from response
            start = raw.find("{")
            end = raw.rfind("}") + 1
            decision_data = json.loads(raw[start:end])

            return TradeDecision(
                **decision_data,
                ticker=ticker,
                timestamp=datetime.now(timezone.utc).isoformat(),
                ai_model=self.model,
            )

        except Exception as e:
            logger.error(f"AI analysis failed for {ticker}: {e}")
            raise

    async def run_market_scan(self):
        """Scheduled: scan all watched assets and fire trades for active bot users."""
        logger.info("Running AI market scan...")
        # In production: get all users with bot_active=True from DB
        # For each user, get their watchlist and portfolio, run analysis, execute if confident
        watchlist = ["NVDA", "MSFT", "AAPL", "GOOGL", "META", "AMZN", "TSLA", "AMD"]
        for ticker in watchlist:
            try:
                market_data = await self.market.get_full_analysis(ticker)
                decision = await self._quick_scan(ticker, market_data)
                if decision and decision.get("confidence", 0) >= 80:
                    logger.info(f"High-confidence signal: {ticker} — {decision['action']} ({decision['confidence']}%)")
                    # In production: loop through eligible users and execute trades
            except Exception as e:
                logger.error(f"Scan error for {ticker}: {e}")
            await asyncio.sleep(0.5)  # Rate limit

    async def run_crypto_scan(self):
        """Scheduled: scan crypto markets 24/7."""
        logger.info("Running crypto scan...")
        crypto_tickers = ["BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD"]
        for ticker in crypto_tickers:
            try:
                market_data = await self.market.get_crypto_data(ticker)
                decision = await self._quick_scan(ticker, market_data)
                if decision and decision.get("confidence", 0) >= 82:
                    logger.info(f"Crypto signal: {ticker} — {decision['action']}")
            except Exception as e:
                logger.error(f"Crypto scan error: {e}")

    async def run_afterhours_analysis(self):
        """Scheduled: deep analysis after market close — prepare tomorrow's positions."""
        logger.info("Running after-hours deep analysis...")
        prompt = """
It's after market close. Run a comprehensive analysis:
1. What happened in the market today and why?
2. What are the 3 highest-conviction opportunities for tomorrow?
3. Are there any positions I should consider exiting before open?
4. Any macro events tomorrow that will move markets?
5. Crypto market overnight outlook?

Provide a structured JSON report for each point.
"""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        logger.info(f"After-hours analysis complete: {response.content[0].text[:200]}...")

    async def execute_trade_for_user(
        self,
        user_id: str,
        decision: TradeDecision,
        portfolio_value: float,
    ) -> dict:
        """Execute a trade decision for a specific user via Alpaca."""
        try:
            position_value = portfolio_value * (decision.position_size_pct / 100)
            result = await self.broker.place_order(
                user_id=user_id,
                ticker=decision.ticker,
                action=decision.action,
                notional=position_value,
                stop_loss=decision.stop_loss,
            )
            logger.info(f"Trade executed for {user_id}: {decision.action} {decision.ticker} ${position_value:.2f}")
            # In production: save trade + reasoning to DB, send push notification
            return {
                "success": True,
                "order_id": result.get("id"),
                "reasoning": decision.reasoning,
                "confidence": decision.confidence,
            }
        except Exception as e:
            logger.error(f"Trade execution failed for {user_id}: {e}")
            raise

    async def generate_portfolio_rebalance(
        self,
        portfolio: dict,
        risk_profile: str,
        market_context: str,
    ) -> dict:
        """Generate a full portfolio rebalance recommendation."""
        prompt = f"""
Current portfolio: {json.dumps(portfolio, indent=2)}
Risk profile: {risk_profile}
Market context: {market_context}

Generate a complete rebalance plan. For each position:
- Keep, increase, decrease, or exit?
- Exact target allocation percentages
- Entry/exit reasoning

Output as structured JSON.
"""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end]) if start >= 0 else {"analysis": raw}

    async def explain_market_event(self, event: str) -> str:
        """Plain-English explanation of any market event for users."""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": f"Explain this market event in plain English for a retail investor, and how it might affect their portfolio: {event}"
            }],
        )
        return response.content[0].text

    async def _quick_scan(self, ticker: str, market_data: dict) -> Optional[dict]:
        """Fast lightweight scan to filter for high-conviction signals."""
        prompt = f"Quick scan {ticker}. Data: {json.dumps(market_data)}. Score 0-100 conviction for a trade right now. Output JSON: {{action, confidence, one_line_reason}}"
        try:
            response = await self.client.messages.create(
                model="claude-haiku-4-5-20251001",  # Fast model for quick scans
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
            start = raw.find("{")
            end = raw.rfind("}") + 1
            return json.loads(raw[start:end]) if start >= 0 else None
        except Exception:
            return None
