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
    calculate_max_drawdown,
    calculate_returns,
    calculate_sharpe,
    calculate_volatility,
    run_calculation,
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
    try:
        data = fetch_market_data(body.symbol, body.period)
        return {"data": data}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/calculate")
def calculate(body: CalculateRequest) -> dict[str, Any]:
    try:
        return run_calculation(
            body.type,
            body.data,
            data_y=body.data_y,
            market_returns=body.market_returns,
            risk_free=body.risk_free,
            confidence=body.confidence,
            from_prices=body.from_prices,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/macro")
def macro(body: MacroRequest) -> dict[str, Any]:
    series_id = resolve_series_id(body.indicator)
    data = fetch_fred_data(series_id)
    return {"data": data}


@app.post("/report")
def report(body: ReportRequest) -> dict[str, Any]:
    return generate_report(body.analysis_id)
