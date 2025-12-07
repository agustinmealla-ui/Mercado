"""
Get Historical Prices Tool

Retrieves historical price data for an underlying asset using yfinance.
Provides OHLCV (Open, High, Low, Close, Volume) data for charting and analysis.
"""

import yfinance as yf
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List

@dataclass
class HistoricalPrice:
    """Historical price data point"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

@dataclass
class HistoricalPriceData:
    """Complete historical price dataset"""
    underlying: str
    long_name: str
    currency: str
    current_price: float
    start_date: str
    end_date: str
    interval: str
    data: List[HistoricalPrice]


def get_historical_prices(
    underlying: str,
    period: str = "3mo",
    interval: str = "1d"
) -> HistoricalPriceData:
    """Get historical price data for an underlying asset.

    Args:
        underlying: Stock ticker symbol (e.g., "AAPL", "SPY", "TSLA")
        period: Time period to fetch. Valid values:
                "1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"
        interval: Data interval. Valid values:
                  "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"

    Returns:
        HistoricalPriceData object containing OHLCV data

    Raises:
        ValueError: If ticker is invalid or data cannot be fetched
    """
    ticker = yf.Ticker(underlying)

    # Get ticker info
    try:
        info = ticker.info
        long_name = info.get('longName', underlying)
        currency = info.get('currency', 'USD')
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or 0.0
    except:
        long_name = underlying
        currency = 'USD'
        current_price = 0.0

    # Get historical data
    hist = ticker.history(period=period, interval=interval)

    if hist.empty:
        raise ValueError(f"No historical data available for {underlying}")

    # Convert to list of HistoricalPrice objects
    price_data = []
    for index, row in hist.iterrows():
        price_data.append(HistoricalPrice(
            date=index.strftime('%Y-%m-%d'),
            open=round(float(row['Open']), 2),
            high=round(float(row['High']), 2),
            low=round(float(row['Low']), 2),
            close=round(float(row['Close']), 2),
            volume=int(row['Volume'])
        ))

    # Get date range
    start_date = hist.index[0].strftime('%Y-%m-%d')
    end_date = hist.index[-1].strftime('%Y-%m-%d')

    return HistoricalPriceData(
        underlying=underlying,
        long_name=long_name,
        currency=currency,
        current_price=round(current_price, 2),
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        data=price_data
    )


if __name__ == "__main__":
    # Test the function
    result = get_historical_prices("AAPL", period="1mo", interval="1d")
    print(f"Ticker: {result.underlying}")
    print(f"Name: {result.long_name}")
    print(f"Current Price: ${result.current_price}")
    print(f"Date Range: {result.start_date} to {result.end_date}")
    print(f"Data Points: {len(result.data)}")
    print(f"\nFirst 3 prices:")
    for price in result.data[:3]:
        print(f"  {price.date}: Open=${price.open}, Close=${price.close}, Volume={price.volume:,}")
