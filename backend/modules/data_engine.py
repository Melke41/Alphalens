"""Market data ingestion via yfinance."""

import yfinance as yf


def fetch_market_data(symbol: str, period: str = "1y") -> dict:
    """
    Fetch OHLCV history for a ticker.

    Args:
        symbol: Equity ticker (e.g. AAPL).
        period: yfinance period string (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max).

    Returns:
        dict with keys: symbol, period, dates, open, high, low, close, volume.

    Raises:
        ValueError: Invalid symbol or empty history.
        RuntimeError: Network or provider errors.
    """
    try:
        ticker = yf.Ticker(symbol.upper().strip())
        history = ticker.history(period=period, auto_adjust=False)

        if history is None or history.empty:
            raise ValueError(f"No market data returned for symbol '{symbol}'")

        history = history.reset_index()

        # yfinance may use "Date" or "Datetime" depending on version/interval
        date_col = "Date" if "Date" in history.columns else history.columns[0]
        dates = [
            d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)[:10]
            for d in history[date_col].tolist()
        ]

        def _series(name: str) -> list[float]:
            return [float(v) for v in history[name].tolist()]

        return {
            "symbol": symbol.upper().strip(),
            "period": period,
            "dates": dates,
            "open": _series("Open"),
            "high": _series("High"),
            "low": _series("Low"),
            "close": _series("Close"),
            "volume": [float(v) for v in history["Volume"].tolist()],
        }
    except ValueError:
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch market data for '{symbol}': {exc}") from exc
