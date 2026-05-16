import numpy as np
import pandas as pd
from scipy import stats

def calculate_returns(prices: list) -> list:
    prices = pd.Series(prices)
    returns = prices.pct_change().dropna()
    return returns.tolist()

def calculate_log_returns(prices: list) -> list:
    prices = pd.Series(prices)
    log_returns = np.log(prices / prices.shift(1)).dropna()
    return log_returns.tolist()

def calculate_volatility(returns: list) -> float:
    returns = pd.Series(returns)
    return round(float(returns.std() * np.sqrt(252)), 4)

def calculate_sharpe(returns: list, risk_free: float = 0.05) -> float:
    returns = pd.Series(returns)
    excess = returns.mean() * 252 - risk_free
    vol = returns.std() * np.sqrt(252)
    return round(float(excess / vol) if vol != 0 else 0, 4)

def calculate_sortino(returns: list, risk_free: float = 0.05) -> float:
    returns = pd.Series(returns)
    excess = returns.mean() * 252 - risk_free
    downside = returns[returns < 0].std() * np.sqrt(252)
    return round(float(excess / downside) if downside != 0 else 0, 4)

def calculate_max_drawdown(prices: list) -> float:
    prices = pd.Series(prices)
    peak = prices.expanding().max()
    drawdown = (prices - peak) / peak
    return round(float(drawdown.min()), 4)

def calculate_var(returns: list, confidence: float = 0.95) -> float:
    returns = pd.Series(returns)
    return round(float(np.percentile(returns, (1 - confidence) * 100)), 4)

def calculate_cvar(returns: list, confidence: float = 0.95) -> float:
    returns = pd.Series(returns)
    var = calculate_var(returns.tolist(), confidence)
    cvar = returns[returns <= var].mean()
    return round(float(cvar), 4)

def calculate_beta(asset_returns: list, market_returns: list) -> float:
    asset = pd.Series(asset_returns)
    market = pd.Series(market_returns)
    min_len = min(len(asset), len(market))
    asset = asset[:min_len]
    market = market[:min_len]
    covariance = np.cov(asset, market)[0][1]
    market_variance = np.var(market)
    return round(float(covariance / market_variance) if market_variance != 0 else 1, 4)

def calculate_alpha(asset_returns: list, market_returns: list, risk_free: float = 0.05) -> float:
    beta = calculate_beta(asset_returns, market_returns)
    asset_annual = pd.Series(asset_returns).mean() * 252
    market_annual = pd.Series(market_returns).mean() * 252
    alpha = asset_annual - (risk_free + beta * (market_annual - risk_free))
    return round(float(alpha), 4)

def calculate_correlation(x: list, y: list) -> dict:
    min_len = min(len(x), len(y))
    x = pd.Series(x[:min_len])
    y = pd.Series(y[:min_len])
    corr, pvalue = stats.pearsonr(x, y)
    return {
        "correlation": round(float(corr), 4),
        "p_value": round(float(pvalue), 4),
        "significant": bool(pvalue < 0.05),
        "interpretation": (
            "Strong positive" if corr > 0.7 else
            "Moderate positive" if corr > 0.3 else
            "Weak positive" if corr > 0 else
            "Weak negative" if corr > -0.3 else
            "Moderate negative" if corr > -0.7 else
            "Strong negative"
        )
    }

def calculate_calmar(returns: list, prices: list) -> float:
    annual_return = pd.Series(returns).mean() * 252
    max_dd = abs(calculate_max_drawdown(prices))
    return round(float(annual_return / max_dd) if max_dd != 0 else 0, 4)

def calculate_win_rate(returns: list) -> float:
    returns = pd.Series(returns)
    return round(float((returns > 0).sum() / len(returns) * 100), 2)

def calculate_profit_factor(returns: list) -> float:
    returns = pd.Series(returns)
    gross_profit = returns[returns > 0].sum()
    gross_loss = abs(returns[returns < 0].sum())
    return round(float(gross_profit / gross_loss) if gross_loss != 0 else 0, 4)

def calculate_zscore(prices: list, window: int = 20) -> list:
    prices = pd.Series(prices)
    rolling_mean = prices.rolling(window=window).mean()
    rolling_std = prices.rolling(window=window).std()
    zscore = (prices - rolling_mean) / rolling_std
    return zscore.fillna(0).round(4).tolist()

def run_backtest(prices: list, signals: list) -> dict:
    prices = pd.Series(prices)
    returns = prices.pct_change().fillna(0)
    signals = pd.Series(signals[:len(returns)])
    strategy_returns = returns * signals.shift(1).fillna(0)
    cumulative = (1 + strategy_returns).cumprod()
    return {
        "equity_curve": cumulative.round(4).tolist(),
        "total_return": round(float(cumulative.iloc[-1] - 1) * 100, 2),
        "sharpe": calculate_sharpe(strategy_returns.tolist()),
        "max_drawdown": calculate_max_drawdown(cumulative.tolist()),
        "win_rate": calculate_win_rate(strategy_returns.tolist()),
        "profit_factor": calculate_profit_factor(strategy_returns.tolist())
    }
