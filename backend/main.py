from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

"""AlphaLens FastAPI backend — institutional quant research API."""

import os
import re
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from modules.ai_brain import analyze_query, generate_research_narrative
from modules.data_engine import fetch_market_data
from modules.macro_engine import fetch_fred_data, resolve_series_id
from modules.math_engine import (
    calculate_returns,
    calculate_volatility,
    calculate_sharpe,
    calculate_sortino,
    calculate_max_drawdown,
    calculate_var,
    calculate_cvar,
    calculate_beta,
    calculate_alpha,
    calculate_correlation,
    calculate_calmar,
    calculate_win_rate,
    calculate_profit_factor,
    calculate_zscore,
    run_backtest,
)
from modules.report_engine import generate_report

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(
    title="AlphaLens API",
    description="Institutional-grade AI quantitative research platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request models ---


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User research question")


class MarketDataRequest(BaseModel):
    symbol: str = Field(default="AAPL", examples=["AAPL"])
    period: str = Field(default="1y", examples=["1y", "6mo", "5y"])


class CalculateRequest(BaseModel):
    type: str = Field(..., examples=["sharpe", "returns", "volatility"])
    data: list[float] = Field(default_factory=list)
    data_y: Optional[list[float]] = None
    market_returns: Optional[list[float]] = None
    risk_free: float = 0.05
    confidence: float = 0.95
    from_prices: bool = True


class MacroRequest(BaseModel):
    indicator: str = Field(default="CPI", examples=["CPI", "GDP", "UNRATE"])


class ReportRequest(BaseModel):
    analysis_id: str = Field(default="123")


# --- Routes ---


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "AlphaLens backend running"}


def _normalize_ticker(asset: str) -> str:
    """Best-effort ticker extraction for yfinance."""
    token = str(asset).strip().upper().split()[0]
    return re.sub(r"[^A-Z0-9.^=-]", "", token) or "SPY"


@app.post("/research")
def research(body: ResearchRequest) -> dict[str, Any]:
    query = body.query
    query_analysis = analyze_query(query)

    asset = query_analysis.get("asset") or "SPY"
    timeframe = query_analysis.get("timeframe") or "1y"
    symbol = _normalize_ticker(asset)

    try:
        market = fetch_market_data(symbol, str(timeframe))
        if "error" in market:
            raise ValueError(market["error"])
        prices = market["close"]
        if len(prices) < 2:
            raise ValueError("Insufficient price history")

        returns = calculate_returns(prices)
        volatility = calculate_volatility(returns)
        sharpe = calculate_sharpe(returns)
        max_dd = calculate_max_drawdown(prices)

        total_return = ((prices[-1] / prices[0]) - 1) * 100

        market_stats = {
            "latest_price": round(float(prices[-1]), 4),
            "total_return": round(float(total_return), 4),
            "volatility": round(float(volatility), 4),
            "sharpe_ratio": round(float(sharpe), 4),
            "max_drawdown": round(float(max_dd), 4),
        }

        combined_data = {
            "query_analysis": query_analysis,
            "market_data": {
                "symbol": market.get("symbol", symbol),
                "period": market.get("period", timeframe),
                "data_points": len(prices),
            },
            "market_stats": market_stats,
        }

        narrative = generate_research_narrative(query, combined_data)

        return {
            "query_analysis": query_analysis,
            "market_stats": market_stats,
            "narrative": narrative,
            "status": "success",
        }
    except Exception:
        return {
            "query_analysis": query_analysis,
            "market_stats": None,
            "narrative": "Market data unavailable for this asset",
            "status": "partial",
        }


@app.post("/market-data")
def market_data(body: MarketDataRequest) -> dict[str, Any]:
    data = fetch_market_data(body.symbol, body.period)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return {"data": data}


@app.get("/market/quotes")
async def get_market_quotes():
    symbols = ["SPY", "QQQ", "BTC-USD", "GLD", "^VIX", "AAPL", "NVDA", "TSLA"]
    from modules.data_engine import fetch_multiple_quotes
    return {"quotes": fetch_multiple_quotes(symbols)}


@app.get("/market/fear-greed")
async def get_fear_greed():
    from modules.data_engine import fetch_fear_greed_index
    return fetch_fear_greed_index()


@app.get("/market/movers")
async def get_top_movers():
    from modules.data_engine import fetch_top_movers
    return fetch_top_movers()


@app.get("/market/heatmap")
async def get_heatmap():
    from modules.data_engine import fetch_global_heatmap
    return fetch_global_heatmap()


@app.post("/calculate")
async def calculate(request: dict):
    calc_type = request.get("type")
    symbol = request.get("symbol", "SPY")
    symbol2 = request.get("symbol2", "SPY")
    period = request.get("period", "1y")

    market_data = fetch_market_data(symbol, period)
    prices = market_data.get("close", [])
    returns = calculate_returns(prices)

    if calc_type == "full_analysis":
        market_data2 = fetch_market_data(symbol2, period)
        prices2 = market_data2.get("close", [])
        returns2 = calculate_returns(prices2)

        return {
            "symbol": symbol,
            "period": period,
            "latest_price": market_data.get("latest_price"),
            "total_return": round(float((prices[-1] - prices[0]) / prices[0] * 100), 2) if prices else 0,
            "volatility": calculate_volatility(returns),
            "sharpe_ratio": calculate_sharpe(returns),
            "sortino_ratio": calculate_sortino(returns),
            "max_drawdown": calculate_max_drawdown(prices),
            "var_95": calculate_var(returns),
            "cvar_95": calculate_cvar(returns),
            "beta": calculate_beta(returns, returns2),
            "alpha": calculate_alpha(returns, returns2),
            "win_rate": calculate_win_rate(returns),
            "profit_factor": calculate_profit_factor(returns),
            "calmar_ratio": calculate_calmar(returns, prices),
            "correlation": calculate_correlation(returns, returns2),
            "zscore": calculate_zscore(prices),
            "dates": market_data.get("dates", []),
            "prices": prices,
            "returns": returns
        }

    return {"error": "Unknown calculation type"}


@app.post("/macro")
def macro(body: MacroRequest) -> dict[str, Any]:
    series_id = resolve_series_id(body.indicator)
    data = fetch_fred_data(series_id)
    return {"data": data}


@app.post("/report")
def report(body: ReportRequest) -> dict[str, Any]:
    return generate_report(body.analysis_id)
