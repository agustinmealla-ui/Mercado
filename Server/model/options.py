from dataclasses import dataclass
from typing import List

@dataclass
class GetOptionExpirations:
    underlying: str
    expirations: List[str]
    count: int
    
@dataclass    
class OptionQuote:
    contractSymbol: str
    lastTradeDate: str
    strike: float
    lastPrice: float
    bid: float
    ask: float
    mid: float
    volume: int
    openInterest: int
    intheMoney: bool

@dataclass
class Option_Chain:
    underlying: str
    long_name: str
    currency: str
    expiration: str
    as_of: str
    spot : float
    calls: List[OptionQuote]
    puts: List[OptionQuote]
   
@dataclass
class OptionGreeks:
    contractSymbol: str
    strike: float
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float    
@dataclass
class Greeks:
    underlying: str
    expiration: str    
    calls: List[OptionGreeks]
    puts: List[OptionGreeks]
    
@dataclass
class ImpliedDistribution:
    expiration: str
    underlying: str
    strikes: List[float]
    spot: float
    dte: int
    risk_free_rate: float
    mean: float
    std_dev: float
    skewness: float
    kurtosis: float
    quantile_25: float
    quantile_50: float
    quantile_75: float
    bowley_skewness: float
    VaR_95: float
    VaR_95_loss: float
    probability_below_spot: float
    probability_above_spot: float
    distribution_summary: List[dict]
        
        
@dataclass
class OptionPayoff:
    underlying: str
    expiration: str
    strike: float
    side: str
    option_type: str
    premium: float
    spot_current: float
    spot_prices: List[float]
    payoffs: List[float]
    profits: List[float]
    greeks: OptionGreeks
         
         
       