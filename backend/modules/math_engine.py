"""Quantitative math engine — returns, risk, and factor statistics."""

import numpy as np
from scipy import stats

TRADING_DAYS = 252


def calculate_returns(prices: list) -> list[float]:
    """Simple percentage returns from a price series."""
    arr = np.asarray(prices, dtype=float)
    if arr.size < 2:
        return []
    returns = np.diff(arr) / arr[:-1]
    return returns.tolist()


def calculate_volatility(returns: list) -> float:
    """Annualized volatility (sample std × √252)."""
    arr = np.asarray(returns, dtype=float)
    if arr.size < 2:
        return 0.0
    return float(arr.std(ddof=1) * np.sqrt(TRADING_DAYS))


def calculate_sharpe(returns: list, risk_free: float = 0.05) -> float:
    """Annualized Sharpe ratio using daily returns."""
    arr = np.asarray(returns, dtype=float)
    if arr.size < 2:
        return 0.0
    ann_return = float(arr.mean() * TRADING_DAYS)
    ann_vol = float(arr.std(ddof=1) * np.sqrt(TRADING_DAYS))
    if ann_vol == 0:
        return 0.0
    return (ann_return - risk_free) / ann_vol


def calculate_max_drawdown(prices: list) -> float:
    """Maximum drawdown as a negative fraction (e.g. -0.25 = -25%)."""
    arr = np.asarray(prices, dtype=float)
    if arr.size < 2:
        return 0.0
    running_peak = np.maximum.accumulate(arr)
    drawdowns = (arr - running_peak) / running_peak
    return float(drawdowns.min())


def calculate_var(returns: list, confidence: float = 0.95) -> float:
    """Historical Value at Risk at the given confidence level."""
    arr = np.asarray(returns, dtype=float)
    if arr.size == 0:
        return 0.0
    percentile = (1.0 - confidence) * 100.0
    return float(np.percentile(arr, percentile))


def calculate_correlation(x: list, y: list) -> dict:
    """Pearson correlation and two-tailed p-value."""
    x_arr = np.asarray(x, dtype=float)
    y_arr = np.asarray(y, dtype=float)
    if x_arr.size < 2 or y_arr.size < 2 or x_arr.size != y_arr.size:
        return {"correlation": 0.0, "p_value": 1.0}
    r, p_value = stats.pearsonr(x_arr, y_arr)
    return {"correlation": float(r), "p_value": float(p_value)}


def calculate_beta(asset_returns: list, market_returns: list) -> float:
    """CAPM beta = Cov(asset, market) / Var(market)."""
    asset = np.asarray(asset_returns, dtype=float)
    market = np.asarray(market_returns, dtype=float)
    if asset.size < 2 or market.size < 2 or asset.size != market.size:
        return 0.0
    covariance = np.cov(asset, market, ddof=1)
    market_variance = covariance[1, 1]
    if market_variance == 0:
        return 0.0
    return float(covariance[0, 1] / market_variance)


def run_calculation(calc_type: str, data: list, **kwargs) -> dict:
    """Dispatch a calculation by type name."""
    calc_type = calc_type.lower().strip()

    if calc_type == "returns":
        return {"result": calculate_returns(data)}

    if calc_type == "volatility":
        returns = data if kwargs.get("from_prices") is False else calculate_returns(data)
        return {"result": calculate_volatility(returns)}

    if calc_type == "sharpe":
        returns = data if kwargs.get("from_prices") is False else calculate_returns(data)
        risk_free = float(kwargs.get("risk_free", 0.05))
        return {"result": calculate_sharpe(returns, risk_free=risk_free)}

    if calc_type == "max_drawdown":
        return {"result": calculate_max_drawdown(data)}

    if calc_type == "var":
        confidence = float(kwargs.get("confidence", 0.95))
        returns = data if kwargs.get("from_prices") is False else calculate_returns(data)
        return {"result": calculate_var(returns, confidence=confidence)}

    if calc_type == "correlation":
        y = kwargs.get("data_y") or []
        return {"result": calculate_correlation(data, y)}

    if calc_type == "beta":
        market = kwargs.get("market_returns") or []
        asset_returns = data if kwargs.get("from_prices") is False else calculate_returns(data)
        market_returns = (
            market if kwargs.get("market_from_prices") is False else calculate_returns(market)
        )
        return {"result": calculate_beta(asset_returns, market_returns)}

    raise ValueError(
        f"Unknown calculation type '{calc_type}'. "
        "Supported: returns, volatility, sharpe, max_drawdown, var, correlation, beta"
    )
