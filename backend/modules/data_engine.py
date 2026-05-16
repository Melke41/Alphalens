import yfinance as yf
import requests
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

FRED_API_KEY = os.getenv("FRED_API_KEY")

def fetch_market_data(symbol: str, period: str = "1y") -> dict:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        if hist.empty:
            return {"error": f"No data found for {symbol}"}
        return {
            "symbol": symbol,
            "period": period,
            "dates": hist.index.strftime("%Y-%m-%d").tolist(),
            "open": hist["Open"].round(2).tolist(),
            "high": hist["High"].round(2).tolist(),
            "low": hist["Low"].round(2).tolist(),
            "close": hist["Close"].round(2).tolist(),
            "volume": hist["Volume"].tolist(),
            "latest_price": round(float(hist["Close"].iloc[-1]), 2),
            "price_change": round(float(hist["Close"].iloc[-1] - hist["Close"].iloc[-2]), 2),
            "price_change_pct": round(float((hist["Close"].iloc[-1] - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2] * 100), 2)
        }
    except Exception as e:
        return {"error": str(e)}

def fetch_multiple_quotes(symbols: list) -> list:
    results = []
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if not hist.empty and len(hist) >= 2:
                price = round(float(hist["Close"].iloc[-1]), 2)
                prev = round(float(hist["Close"].iloc[-2]), 2)
                change_pct = round((price - prev) / prev * 100, 2)
                results.append({
                    "symbol": symbol,
                    "price": price,
                    "change_pct": change_pct,
                    "change": round(price - prev, 2),
                    "positive": change_pct >= 0
                })
        except Exception:
            pass
    return results

def fetch_fear_greed_index() -> dict:
    try:
        # Calculate from VIX and market momentum
        vix = yf.Ticker("^VIX")
        spy = yf.Ticker("SPY")
        
        vix_hist = vix.history(period="1mo")
        spy_hist = spy.history(period="3mo")
        
        # VIX component (inverted - high VIX = fear)
        current_vix = float(vix_hist["Close"].iloc[-1])
        vix_score = max(0, min(100, 100 - (current_vix - 10) * 2.5))
        
        # Momentum component
        spy_return = float((spy_hist["Close"].iloc[-1] - spy_hist["Close"].iloc[0]) / spy_hist["Close"].iloc[0] * 100)
        momentum_score = max(0, min(100, 50 + spy_return * 2))
        
        # Combined score
        score = round((vix_score * 0.5) + (momentum_score * 0.5))
        
        if score <= 25:
            label = "Extreme Fear"
            color = "#ef4444"
        elif score <= 45:
            label = "Fear"
            color = "#f97316"
        elif score <= 55:
            label = "Neutral"
            color = "#eab308"
        elif score <= 75:
            label = "Greed"
            color = "#22c55e"
        else:
            label = "Extreme Greed"
            color = "#3b82f6"
            
        return {
            "score": score,
            "label": label,
            "color": color,
            "vix": round(current_vix, 2),
            "spy_return_3mo": round(spy_return, 2)
        }
    except Exception as e:
        return {"error": str(e), "score": 50, "label": "Neutral", "color": "#eab308"}

def fetch_top_movers() -> dict:
    try:
        symbols = [
            "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
            "TSLA", "META", "BTC-USD", "ETH-USD", "SPY"
        ]
        quotes = fetch_multiple_quotes(symbols)
        sorted_quotes = sorted(quotes, key=lambda x: abs(x["change_pct"]), reverse=True)
        gainers = [q for q in sorted_quotes if q["positive"]][:3]
        losers = [q for q in sorted_quotes if not q["positive"]][:3]
        return {"gainers": gainers, "losers": losers}
    except Exception as e:
        return {"error": str(e)}

def fetch_global_heatmap() -> list:
    try:
        markets = {
            "S&P 500": "SPY",
            "NASDAQ": "QQQ", 
            "Dow Jones": "DIA",
            "Bitcoin": "BTC-USD",
            "Ethereum": "ETH-USD",
            "Gold": "GLD",
            "Oil": "USO",
            "EUR/USD": "EURUSD=X",
            "Tesla": "TSLA",
            "Apple": "AAPL",
            "NVIDIA": "NVDA",
            "Amazon": "AMZN"
        }
        results = []
        quotes = fetch_multiple_quotes(list(markets.values()))
        quote_map = {q["symbol"]: q for q in quotes}
        for name, symbol in markets.items():
            if symbol in quote_map:
                q = quote_map[symbol]
                results.append({
                    "name": name,
                    "symbol": symbol,
                    "price": q["price"],
                    "change_pct": q["change_pct"],
                    "positive": q["positive"]
                })
        return results
    except Exception as e:
        return []
