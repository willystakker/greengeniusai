"""
GreenGeniusAI — Market Data Service
Pulls live data from Polygon.io for stocks and crypto.
Computes technical indicators using the `ta` library.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
import pandas as pd
import ta
from functools import lru_cache

logger = logging.getLogger(__name__)


class MarketDataService:
    def __init__(self):
        import os
        self.polygon_key = os.getenv("POLYGON_API_KEY", "")
        self.base_url = "https://api.polygon.io"
        self._client: Optional[httpx.AsyncClient] = None

    async def start(self):
        self._client = httpx.AsyncClient(timeout=10.0)
        logger.info("Market data service started")

    async def stop(self):
        if self._client:
            await self._client.aclose()

    async def get_status(self) -> str:
        return "live" if self._client else "offline"

    # ── Core data fetchers ────────────────────────────────────────────────────

    async def get_quote(self, ticker: str) -> dict:
        """Get real-time quote for a stock or ETF."""
        url = f"{self.base_url}/v2/last/trade/{ticker}"
        resp = await self._client.get(url, params={"apiKey": self.polygon_key})
        resp.raise_for_status()
        data = resp.json()
        return {
            "ticker": ticker,
            "price": data.get("results", {}).get("p", 0),
            "size": data.get("results", {}).get("s", 0),
            "timestamp": data.get("results", {}).get("t", 0),
        }

    async def get_ohlcv(self, ticker: str, days: int = 60) -> pd.DataFrame:
        """Get OHLCV bars for technical analysis."""
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        to_date = datetime.now().strftime("%Y-%m-%d")
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{from_date}/{to_date}"
        resp = await self._client.get(url, params={"apiKey": self.polygon_key, "adjusted": "true", "sort": "asc"})
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if not results:
            return pd.DataFrame()
        df = pd.DataFrame(results)
        df.rename(columns={"o": "open", "h": "high", "l": "low", "c": "close", "v": "volume", "t": "timestamp"}, inplace=True)
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        return df.set_index("timestamp")

    async def get_technicals(self, ticker: str) -> dict:
        """Compute comprehensive technical indicators."""
        df = await self.get_ohlcv(ticker, days=90)
        if df.empty or len(df) < 20:
            return {}

        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"]

        # RSI
        rsi = ta.momentum.RSIIndicator(close).rsi().iloc[-1]
        # MACD
        macd_ind = ta.trend.MACD(close)
        macd = macd_ind.macd().iloc[-1]
        macd_signal = macd_ind.macd_signal().iloc[-1]
        macd_diff = macd_ind.macd_diff().iloc[-1]
        # Bollinger Bands
        bb = ta.volatility.BollingerBands(close)
        bb_upper = bb.bollinger_hband().iloc[-1]
        bb_lower = bb.bollinger_lband().iloc[-1]
        bb_pct = bb.bollinger_pband().iloc[-1]
        # Moving averages
        sma20 = ta.trend.SMAIndicator(close, 20).sma_indicator().iloc[-1]
        sma50 = ta.trend.SMAIndicator(close, 50).sma_indicator().iloc[-1]
        ema12 = ta.trend.EMAIndicator(close, 12).ema_indicator().iloc[-1]
        # ATR (volatility)
        atr = ta.volatility.AverageTrueRange(high, low, close).average_true_range().iloc[-1]
        # Volume trend
        vol_sma20 = volume.rolling(20).mean().iloc[-1]
        vol_ratio = float(volume.iloc[-1]) / float(vol_sma20) if vol_sma20 > 0 else 1.0
        # Price change
        price_1d = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100
        price_5d = ((close.iloc[-1] - close.iloc[-6]) / close.iloc[-6]) * 100 if len(close) > 6 else 0
        price_20d = ((close.iloc[-1] - close.iloc[-21]) / close.iloc[-21]) * 100 if len(close) > 21 else 0

        current_price = float(close.iloc[-1])

        return {
            "current_price": round(current_price, 2),
            "rsi": round(float(rsi), 2),
            "rsi_signal": "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral",
            "macd": round(float(macd), 4),
            "macd_signal": round(float(macd_signal), 4),
            "macd_histogram": round(float(macd_diff), 4),
            "macd_crossover": "bullish" if macd > macd_signal else "bearish",
            "bb_upper": round(float(bb_upper), 2),
            "bb_lower": round(float(bb_lower), 2),
            "bb_position": round(float(bb_pct), 2),
            "sma20": round(float(sma20), 2),
            "sma50": round(float(sma50), 2),
            "ema12": round(float(ema12), 2),
            "above_sma20": current_price > float(sma20),
            "above_sma50": current_price > float(sma50),
            "golden_cross": float(sma20) > float(sma50),
            "atr": round(float(atr), 2),
            "atr_pct": round(float(atr) / current_price * 100, 2),
            "volume_ratio": round(float(vol_ratio), 2),
            "volume_surge": float(vol_ratio) > 1.5,
            "price_change_1d": round(float(price_1d), 2),
            "price_change_5d": round(float(price_5d), 2),
            "price_change_20d": round(float(price_20d), 2),
        }

    async def get_news_sentiment(self, ticker: str) -> dict:
        """Get recent news and sentiment score."""
        url = f"{self.base_url}/v2/reference/news"
        resp = await self._client.get(url, params={
            "ticker": ticker,
            "limit": 10,
            "apiKey": self.polygon_key,
        })
        resp.raise_for_status()
        articles = resp.json().get("results", [])
        # Simple sentiment: count positive vs negative keywords
        positive = ["beat", "surge", "record", "growth", "up", "raised", "strong", "bullish", "exceeds"]
        negative = ["miss", "fall", "decline", "cut", "weak", "bearish", "loss", "layoff", "recall"]
        pos_count = neg_count = 0
        headlines = []
        for art in articles[:5]:
            title = art.get("title", "").lower()
            headlines.append(art.get("title", ""))
            pos_count += sum(1 for w in positive if w in title)
            neg_count += sum(1 for w in negative if w in title)
        total = pos_count + neg_count
        score = (pos_count / total * 100) if total > 0 else 50
        return {
            "sentiment_score": round(score, 1),
            "sentiment": "bullish" if score > 60 else "bearish" if score < 40 else "neutral",
            "recent_headlines": headlines,
            "article_count": len(articles),
        }

    async def get_full_analysis(self, ticker: str) -> dict:
        """Aggregate all data sources into one context object for the AI."""
        technicals, sentiment = await asyncio.gather(
            self.get_technicals(ticker),
            self.get_news_sentiment(ticker),
            return_exceptions=True,
        )
        return {
            "ticker": ticker,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "technicals": technicals if isinstance(technicals, dict) else {},
            "sentiment": sentiment if isinstance(sentiment, dict) else {},
        }

    async def get_crypto_data(self, pair: str) -> dict:
        """Get crypto pair data (e.g. BTC/USD)."""
        ticker = pair.replace("/", "X:")
        return await self.get_full_analysis(ticker)

    async def get_market_movers(self, direction: str = "gainers") -> list[dict]:
        """Get top market movers — used to seed the AI watchlist."""
        url = f"{self.base_url}/v2/snapshot/locale/us/markets/stocks/{direction}"
        resp = await self._client.get(url, params={"apiKey": self.polygon_key})
        resp.raise_for_status()
        tickers = resp.json().get("tickers", [])
        return [
            {
                "ticker": t.get("ticker"),
                "change_pct": t.get("todaysChangePerc", 0),
                "price": t.get("day", {}).get("c", 0),
                "volume": t.get("day", {}).get("v", 0),
            }
            for t in tickers[:20]
        ]
