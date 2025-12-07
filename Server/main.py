"""
Options Analysis MCP Server

Provides Model Context Protocol (MCP) access to comprehensive options analysis tools
including option chains, Greeks calculation, implied distributions, payoff profiles,
and historical price data.

This server exposes 6 tools for options analysis:
- get_expirations: Get available expiration dates for options
- get_chain: Retrieve complete option chain data (calls and puts)
- compute_greeks: Calculate Black-Scholes Greeks for all options
- get_distribution: Extract risk-neutral probability distribution (Breeden-Litzenberger)
- compute_payoff_profile: Generate payoff and profit/loss diagrams
- get_historical_prices_tool: Get historical OHLCV price data for charting
"""

from mcp.server.fastmcp import FastMCP
from typing import Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import underlying tool functions
from Server.core.tools.get_expiration import get_option_expiration
from Server.core.tools.get_option_chain import get_option_chain
from Server.core.tools.greeks import compute_greeks_chain
from Server.core.tools.get_implied_distribution import get_implied_distribution
from Server.core.tools.compute_payoff import compute_option_payoff
from Server.core.tools.get_historical_prices import get_historical_prices

# Initialize MCP server with JSON response mode
mcp = FastMCP(name="options-analysis-server", json_response=True)


@mcp.tool()
def get_expirations(underlying: str) -> dict:
    """Get all available option expiration dates for a ticker.

    Retrieves the complete list of expiration dates available for trading
    options on a specific underlying asset from Yahoo Finance.

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")

    Returns:
        Dictionary containing:
            - underlying (str): The ticker symbol requested
            - expirations (List[str]): List of expiration dates in "YYYY-MM-DD" format
            - count (int): Total number of available expiration dates

    Example:
        >>> get_expirations("AAPL")
        {
            "underlying": "AAPL",
            "expirations": ["2025-12-05", "2025-12-12", "2025-12-19", ...],
            "count": 28
        }
    """
    result = get_option_expiration(underlying)
    return vars(result)


@mcp.tool()
def get_chain(underlying: str, expiration: str) -> dict:
    """Get complete option chain (calls and puts) for a specific expiration.

    Retrieves all available call and put options for a given underlying asset and
    expiration date, including market data, strikes, and pricing information.

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")
        expiration: Expiration date in "YYYY-MM-DD" format

    Returns:
        Dictionary containing:
            - underlying (str): Ticker symbol
            - long_name (str): Full company/asset name
            - currency (str): Currency of the asset (e.g., "USD")
            - expiration (str): Expiration date
            - as_of (str): Valuation date (today's date)
            - spot (float): Current spot price of the underlying
            - calls (List[dict]): List of call options with full quote data
            - puts (List[dict]): List of put options with full quote data

    Each option in calls/puts contains:
        - contractSymbol: Option contract identifier
        - strike: Strike price
        - lastPrice: Last traded price
        - bid: Bid price
        - ask: Ask price
        - mid: Mid price (bid+ask)/2
        - volume: Trading volume
        - openInterest: Open interest
        - intheMoney: Whether option is in the money
        - lastTradeDate: Last trade date

    Raises:
        ValueError: If expiration date is not available for the underlying

    Example:
        >>> get_chain("AAPL", "2025-12-26")
        {
            "underlying": "AAPL",
            "long_name": "Apple Inc.",
            "spot": 227.48,
            "calls": [...],
            "puts": [...]
        }
    """
    chain = get_option_chain(underlying, expiration)
    return {
        "underlying": chain.underlying,
        "long_name": chain.long_name,
        "currency": chain.currency,
        "expiration": chain.expiration,
        "as_of": chain.as_of,
        "spot": chain.spot,
        "calls": [vars(c) for c in chain.calls],
        "puts": [vars(p) for p in chain.puts],
    }


@mcp.tool()
def compute_greeks(underlying: str, expiration: str) -> dict:
    """Calculate Black-Scholes Greeks (delta, gamma, theta, vega, rho) for all options.

    Computes Delta, Gamma, Theta, Vega, and Rho for every call and put option
    at a specific expiration using the Black-Scholes option pricing model with
    implied volatility calculated from market prices.

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")
        expiration: Expiration date in "YYYY-MM-DD" format

    Returns:
        Dictionary containing:
            - underlying (str): Ticker symbol
            - expiration (str): Expiration date
            - calls (List[dict]): Greeks for each call option
            - puts (List[dict]): Greeks for each put option

    Each option's Greeks dict contains:
        - contractSymbol (str): Option contract identifier
        - strike (float): Strike price
        - delta (float): Rate of change of option price vs underlying price
        - gamma (float): Rate of change of delta vs underlying price
        - theta (float): Rate of time decay (per day)
        - vega (float): Sensitivity to volatility changes
        - rho (float): Sensitivity to interest rate changes

    Raises:
        ValueError: If expiration date is not available

    Example:
        >>> compute_greeks("AAPL", "2025-12-26")
        {
            "underlying": "AAPL",
            "expiration": "2025-12-26",
            "calls": [
                {"strike": 150.0, "delta": 0.9823, "gamma": 0.0012, ...}
            ],
            "puts": [...]
        }
    """
    greeks = compute_greeks_chain(underlying, expiration)
    return {
        "underlying": greeks.underlying,
        "expiration": greeks.expiration,
        "calls": [vars(g) for g in greeks.calls],
        "puts": [vars(g) for g in greeks.puts],
    }


@mcp.tool()
def get_distribution(
    underlying: str,
    expiration: str,
    min_moneyness: float = 0.7,
    max_moneyness: float = 1.3
) -> dict:
    """Extract risk-neutral probability distribution from option prices using Breeden-Litzenberger.

    Uses the Breeden-Litzenberger method to derive the market's implied probability
    distribution of future prices from option prices. Provides comprehensive statistical
    measures including moments, quantiles, and risk metrics.

    This is the primary tool for advanced options analysis and distribution extraction.

    Methodology:
        1. Extract call option chain within moneyness range
        2. Calculate implied volatility for each strike
        3. Apply Gaussian smoothing to volatility curve
        4. Interpolate strikes at $0.01 intervals
        5. Compute PDF via Breeden-Litzenberger: PDF = e^(rt) * d²C/dK²
        6. Normalize distribution and calculate statistics

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")
        expiration: Expiration date in "YYYY-MM-DD" format
        min_moneyness: Minimum strike/spot ratio (default: 0.7 for 30% OTM puts)
        max_moneyness: Maximum strike/spot ratio (default: 1.3 for 30% OTM calls)

    Returns:
        Dictionary containing complete distribution analysis:

        Basic Information:
            - underlying (str): Ticker symbol
            - expiration (str): Expiration date
            - spot (float): Current spot price
            - dte (int): Days to expiration
            - risk_free_rate (float): Interpolated risk-free rate
            - strikes (List[float]): Valid strikes used in calculation

        Statistical Moments:
            - mean (float): Expected price at expiration
            - std_dev (float): Standard deviation of distribution
            - skewness (float): Third standardized moment (asymmetry)
            - kurtosis (float): Fourth standardized moment (tail weight)

        Quantiles:
            - quantile_25 (float): 25th percentile price
            - quantile_50 (float): Median price (50th percentile)
            - quantile_75 (float): 75th percentile price
            - bowley_skewness (float): Quartile-based skewness measure

        Risk Metrics:
            - VaR_95 (float): Value at Risk at 95% confidence level
            - VaR_95_loss (float): Potential loss from current spot to VaR
            - probability_below_spot (float): Probability of closing below current price
            - probability_above_spot (float): Probability of closing above current price

        Distribution Data:
            - distribution_summary (List[dict]): Price bins with probabilities
              Each dict contains: {"strike_bin": float, "probability": float}

    Raises:
        ValueError: If insufficient options in moneyness range (need at least 3)

    Example:
        >>> get_distribution("SPY", "2025-03-21", min_moneyness=0.8, max_moneyness=1.2)
        {
            "underlying": "SPY",
            "spot": 602.45,
            "mean": 605.23,
            "std_dev": 18.45,
            "skewness": -0.1234,
            "kurtosis": 3.2156,
            "VaR_95": 575.67,
            "probability_below_spot": 0.4823,
            "distribution_summary": [
                {"strike_bin": 580.5, "probability": 0.0123},
                {"strike_bin": 581.5, "probability": 0.0145},
                ...
            ]
        }
    """
    result = get_implied_distribution(underlying, expiration, min_moneyness, max_moneyness)
    return vars(result)


@mcp.tool()
def compute_payoff_profile(
    side: str,
    option_type: str,
    underlying: str,
    strike: float,
    expiration: str,
    spot_min: Optional[float] = None,
    spot_max: Optional[float] = None
) -> dict:
    """Calculate complete payoff and profit/loss profile for an option position.

    Computes the payoff diagram, P&L profile, and position Greeks for a single
    option position (long or short, call or put) across a range of spot prices.
    Useful for visualizing option strategies and understanding risk/reward profiles.

    Payoff Formulas (multiplied by 100 for standard contract value):
        Long Call:  max(S - K, 0) * 100
        Long Put:   max(K - S, 0) * 100
        Short Call: -max(S - K, 0) * 100
        Short Put:  -max(K - S, 0) * 100

    Profit Formulas (multiplied by 100 for standard contract value):
        Long:  Payoff - Premium * 100
        Short: Premium * 100 + Payoff

    Args:
        side: Position side - "long" (buy) or "short" (sell)
        option_type: Option type - "call" or "put"
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY")
        strike: Strike price of the option
        expiration: Expiration date in "YYYY-MM-DD" format
        spot_min: Minimum spot price for payoff range (default: spot * 0.5)
        spot_max: Maximum spot price for payoff range (default: spot * 1.5)

    Returns:
        Dictionary containing:
            - underlying (str): Ticker symbol
            - expiration (str): Expiration date
            - strike (float): Strike price
            - side (str): Position side ("long" or "short")
            - option_type (str): "call" or "put"
            - premium (float): Option premium per share
            - spot_current (float): Current spot price
            - spot_prices (List[float]): 50 simulated spot prices across range
            - payoffs (List[float]): Intrinsic value at expiration for each spot (x100)
            - profits (List[float]): Net P&L including premium for each spot (x100)
            - greeks (dict): Position Greeks adjusted for long/short side
                - contractSymbol, strike, delta, gamma, theta, vega, rho

    Raises:
        ValueError: If strike price doesn't exist in the option chain
        ValueError: If implied volatility cannot be calculated

    Example:
        >>> compute_payoff_profile("long", "call", "AAPL", 150.0, "2025-03-21")
        {
            "side": "long",
            "option_type": "call",
            "strike": 150.0,
            "premium": 82.50,
            "spot_current": 227.48,
            "spot_prices": [113.74, 115.90, ..., 341.22],
            "payoffs": [0, 0, ..., 19122.0],
            "profits": [-8250, -8250, ..., 10872.0],
            "greeks": {
                "delta": 0.9892,
                "gamma": 0.0008,
                "theta": -0.0234,
                "vega": 0.0456,
                "rho": 0.1234
            }
        }
    """
    payoff = compute_option_payoff(
        side=side,
        option_type=option_type,
        underlying=underlying,
        Strike=strike,  # Parameter mapping: strike -> Strike
        expiration=expiration,
        spot_min=spot_min,
        spot_max=spot_max
    )
    return {
        "underlying": payoff.underlying,
        "expiration": payoff.expiration,
        "strike": payoff.strike,
        "side": payoff.side,
        "option_type": payoff.option_type,
        "premium": payoff.premium,
        "spot_current": payoff.spot_current,
        "spot_prices": payoff.spot_prices,
        "payoffs": payoff.payoffs,
        "profits": payoff.profits,
        "greeks": vars(payoff.greeks),
    }


@mcp.tool()
def get_historical_prices_tool(
    underlying: str,
    period: str = "3mo",
    interval: str = "1d"
) -> dict:
    """Get historical price data (OHLCV) for an underlying asset.

    Retrieves Open, High, Low, Close, Volume data for charting and analysis.
    Useful for visualizing recent price movements and trends of the underlying asset.

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")
        period: Time period to fetch. Options:
                "1d", "5d", "1mo", "3mo" (default), "6mo", "1y", "2y", "5y", "10y", "ytd", "max"
        interval: Data interval. Options:
                  "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h",
                  "1d" (default), "5d", "1wk", "1mo", "3mo"

    Returns:
        Dictionary containing:
            - underlying (str): Ticker symbol
            - long_name (str): Full company/asset name
            - currency (str): Currency (e.g., "USD")
            - current_price (float): Latest price
            - start_date (str): Start date of data range (YYYY-MM-DD)
            - end_date (str): End date of data range (YYYY-MM-DD)
            - interval (str): Data interval used
            - data (List[dict]): Historical price data points

    Each data point contains:
        - date (str): Date in YYYY-MM-DD format
        - open (float): Opening price
        - high (float): High price
        - low (float): Low price
        - close (float): Closing price
        - volume (int): Trading volume

    Example:
        >>> get_historical_prices_tool("AAPL", period="1mo", interval="1d")
        {
            "underlying": "AAPL",
            "long_name": "Apple Inc.",
            "current_price": 227.48,
            "start_date": "2024-11-04",
            "end_date": "2024-12-04",
            "data": [
                {
                    "date": "2024-11-04",
                    "open": 222.50,
                    "high": 224.75,
                    "low": 221.30,
                    "close": 223.45,
                    "volume": 45678900
                },
                ...
            ]
        }
    """
    result = get_historical_prices(underlying, period, interval)
    return {
        "underlying": result.underlying,
        "long_name": result.long_name,
        "currency": result.currency,
        "current_price": result.current_price,
        "start_date": result.start_date,
        "end_date": result.end_date,
        "interval": result.interval,
        "data": [vars(d) for d in result.data],
    }


def main() -> None:
    """
    Run the MCP options analysis server.

    Starts the FastMCP server using stdio transport for MCP protocol communication.
    The server exposes 6 tools for comprehensive options analysis:

    - get_expirations: List available expiration dates
    - get_chain: Retrieve option chain data
    - compute_greeks: Calculate Black-Scholes Greeks
    - get_distribution: Extract implied probability distribution (Breeden-Litzenberger)
    - compute_payoff_profile: Generate payoff and profit diagrams
    - get_historical_prices_tool: Get historical OHLCV price data

    The server runs indefinitely and communicates via standard input/output
    using the MCP protocol for tool discovery and invocation.

    Run with --test flag to verify the server can import all dependencies.
    """
    # Test mode to verify imports work
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("[OK] MCP Server Test Mode")
        print("=" * 50)
        print("\n[OK] All imports successful!")
        print("\nRegistered MCP Tools:")
        print("  1. get_expirations - Get option expiration dates")
        print("  2. get_chain - Get option chain (calls & puts)")
        print("  3. compute_greeks - Calculate Black-Scholes Greeks")
        print("  4. get_distribution - Extract implied distribution (PRIMARY)")
        print("  5. compute_payoff_profile - Generate payoff diagrams")
        print("  6. get_historical_prices_tool - Get historical price data")
        print("\n[OK] Server is ready to run!")
        print("\nTo start the MCP server, run without --test flag")
        print("The server will wait for MCP commands via stdin/stdout")
        return

    # Normal mode: run MCP server
    mcp.run()


if __name__ == "__main__":
    main()
