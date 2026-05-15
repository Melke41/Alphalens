"""AlphaLens FastAPI backend — institutional quant research API."""

from __future__ import annotations

import os
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from modules.ai_brain import analyze_query
from modules.data_engine import fetch_market_data
from modules.macro_engine import fetch_fred_data, resolve_series_id
from modules.math_engine import run_calculation
from modules.report_engine import generate_report

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(
    title="AlphaLens API",
    description="Institutional-grade AI quantitative research platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
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


@app.post("/research")
def research(body: ResearchRequest) -> dict[str, Any]:
    return {"result": analyze_query(body.query)}


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
