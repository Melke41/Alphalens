"""
Macroeconomic data via the FRED API.

FRED API key required — add FRED_API_KEY to the backend/.env file.
Register at: https://fred.stlouisfed.org/docs/api/api_key.html
"""

from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

FRED_OBSERVATIONS_URL = "https://api.stlouisfed.org/fred/series/observations"

# Common indicator aliases → FRED series IDs
INDICATOR_SERIES: dict[str, str] = {
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


def resolve_series_id(indicator: str) -> str:
    """Map a friendly indicator name to a FRED series ID."""
    key = indicator.strip().upper()
    return INDICATOR_SERIES.get(key, indicator.strip().upper())


def fetch_fred_data(series_id: str, limit: int = 120) -> dict[str, Any]:
    """
    Fetch observation history from FRED.

    Returns:
        dict with keys: series_id, dates, values, and optional error message.
    """
    api_key = os.getenv("FRED_API_KEY", "").strip()
    placeholder_key = {"", "your_key_here"}

    if api_key in placeholder_key:
        return {
            "series_id": series_id,
            "dates": [],
            "values": [],
            "error": "FRED_API_KEY not configured — add your key to backend/.env",
            "note": "Placeholder until FRED API key is set",
        }

    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
    }

    try:
        response = requests.get(FRED_OBSERVATIONS_URL, params=params, timeout=15)
        response.raise_for_status()
        payload = response.json()
        observations = payload.get("observations", [])

        dates: list[str] = []
        values: list[float | None] = []

        for obs in reversed(observations):
            raw_value = obs.get("value", ".")
            dates.append(obs.get("date", ""))
            if raw_value in (".", "", None):
                values.append(None)
            else:
                values.append(float(raw_value))

        return {
            "series_id": series_id,
            "dates": dates,
            "values": values,
        }
    except requests.RequestException as exc:
        return {
            "series_id": series_id,
            "dates": [],
            "values": [],
            "error": f"FRED API request failed: {exc}",
        }
    except (ValueError, KeyError) as exc:
        return {
            "series_id": series_id,
            "dates": [],
            "values": [],
            "error": f"Failed to parse FRED response: {exc}",
        }
