import requests
import os
import yfinance as yf
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

FRED_API_KEY = os.getenv("FRED_API_KEY")
FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"

def fetch_fred_series(series_id: str, limit: int = 24) -> dict:
    try:
        if not FRED_API_KEY or FRED_API_KEY == "your_key_here":
            return generate_mock_macro_data(series_id)
        params = {
            "series_id": series_id,
            "api_key": FRED_API_KEY,
            "file_type": "json",
            "limit": limit,
            "sort_order": "desc"
        }
        response = requests.get(FRED_BASE, params=params, timeout=10)
        data = response.json()
        observations = data.get("observations", [])
        dates = [o["date"] for o in observations if o["value"] != "."]
        values = [float(o["value"]) for o in observations if o["value"] != "."]
        return {"dates": dates[::-1], "values": values[::-1], "series_id": series_id}
    except Exception as e:
        return generate_mock_macro_data(series_id)

def generate_mock_macro_data(series_id: str) -> dict:
    import random
    base_values = {
        "FEDFUNDS": 5.33, "CPIAUCSL": 3.2, "UNRATE": 3.9,
        "GDP": 27000, "T10Y2Y": 0.15, "M2SL": 21000,
        "T10YIE": 2.3, "DEXUSEU": 1.08
    }
    base = base_values.get(series_id, 100)
    dates = []
    values = []
    from datetime import timedelta
    current = datetime(2023, 1, 1)
    for i in range(24):
        dates.append(current.strftime("%Y-%m-%d"))
        values.append(round(base + random.uniform(-base*0.05, base*0.05), 2))
        current = current.replace(month=current.month % 12 + 1,
                                   year=current.year + (1 if current.month == 12 else 0))
    return {"dates": dates, "values": values, "series_id": series_id}

def fetch_yield_curve() -> dict:
    try:
        tickers = {
            "3M": "^IRX",
            "2Y": "^TYX",
            "10Y": "^TNX",
            "30Y": "^TYX"
        }
        yields = {}
        for label, ticker in tickers.items():
            t = yf.Ticker(ticker)
            hist = t.history(period="1d")
            if not hist.empty:
                yields[label] = round(float(hist["Close"].iloc[-1]) / 10, 3)
        
        spread_10_2 = yields.get("10Y", 4.5) - yields.get("2Y", 4.8)
        inverted = spread_10_2 < 0
        
        return {
            "yields": yields,
            "spread_10_2": round(spread_10_2, 3),
            "inverted": inverted,
            "recession_signal": inverted,
            "interpretation": "INVERTED — Recession signal detected" if inverted else "Normal — Economy expanding"
        }
    except Exception as e:
        return {
            "yields": {"3M": 5.25, "2Y": 4.85, "10Y": 4.50, "30Y": 4.65},
            "spread_10_2": -0.35,
            "inverted": True,
            "recession_signal": True,
            "interpretation": "INVERTED — Recession signal detected"
        }

def fetch_macro_dashboard() -> dict:
    fed_funds = fetch_fred_series("FEDFUNDS", 12)
    inflation = fetch_fred_series("CPIAUCSL", 12)
    unemployment = fetch_fred_series("UNRATE", 12)
    yield_curve = fetch_yield_curve()
    
    return {
        "fed_funds_rate": {
            "current": fed_funds["values"][-1] if fed_funds["values"] else 5.33,
            "previous": fed_funds["values"][-2] if len(fed_funds["values"]) > 1 else 5.33,
            "history": fed_funds
        },
        "inflation": {
            "current": inflation["values"][-1] if inflation["values"] else 3.2,
            "previous": inflation["values"][-2] if len(inflation["values"]) > 1 else 3.1,
            "history": inflation
        },
        "unemployment": {
            "current": unemployment["values"][-1] if unemployment["values"] else 3.9,
            "previous": unemployment["values"][-2] if len(unemployment["values"]) > 1 else 3.8,
            "history": unemployment
        },
        "yield_curve": yield_curve,
        "real_rate": round((fed_funds["values"][-1] if fed_funds["values"] else 5.33) - 
                          (inflation["values"][-1] if inflation["values"] else 3.2), 2)
    }

def resolve_series_id(indicator: str) -> str:
    """Map a friendly indicator name to a FRED series ID."""
    indicator_map = {
        "CPI": "CPIAUCSL",
        "GDP": "GDP",
        "UNEMPLOYMENT": "UNRATE",
        "UNRATE": "UNRATE",
        "FEDFUNDS": "FEDFUNDS",
        "T10Y2Y": "T10Y2Y",
        "VIX": "VIXCLS",
        "PCE": "PCEPI",
        "INFLATION": "CPIAUCSL",
    }
    key = indicator.strip().upper()
    return indicator_map.get(key, indicator.strip().upper())

def fetch_fred_data(series_id: str, limit: int = 120) -> dict:
    """Fetch observation history from FRED (legacy function for compatibility)."""
    return fetch_fred_series(series_id, limit)
