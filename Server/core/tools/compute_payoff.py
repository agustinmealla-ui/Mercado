from Server.model.options import OptionPayoff, OptionGreeks
import yfinance as yf
from Server.utils.bs import implied_volatility, compute_greeks
from Server.utils.get_spot import get_spot_price
from Server.utils.risk_free import get_risk_free_rate
from datetime import date
import numpy as np
from typing import Optional

def compute_option_payoff(
    side: str,
    option_type: str,
    underlying: str,
    Strike: float,
    expiration: str,
    spot_min:Optional[float] = None,
    spot_max:Optional[float] = None,
) -> OptionPayoff:
    ''''''
    spot = get_spot_price(underlying)
    
    ticker = yf.Ticker(underlying)
    

    chain = ticker.option_chain(expiration)
    
    options = chain.calls if option_type.lower() == "call" else chain.puts
    row = options[options['strike'] == Strike]
    
    if row.empty:
        available_strikes = list(options['strike'].unique())
        raise ValueError(
            f"No existe una opción {option_type} con strike {Strike} para {underlying}. "
            f"Strikes disponibles: {available_strikes}"
        )
    
    
    row = row.iloc[0]    
    premium = np.round(float(row['lastPrice']), 3)
    
      
    #parametros bs
    
    r = get_risk_free_rate(expiration)

    t = (date.fromisoformat(expiration) - date.today()).days / 252.0
    
    sigma = implied_volatility(
        S=spot,
        K=Strike,
        t=t,
        r=r,
        Price=premium,
        option_type=option_type,
    )
    if sigma is None or sigma <= 0:
        iv_yf = row.get("impliedVolatility")
        if iv_yf is None or iv_yf <= 0:
            raise ValueError("No se pudo obtener una volatilidad implícita válida.")
        sigma = iv_yf

    greeks_long: OptionGreeks = compute_greeks(
        S=spot,
        K=Strike,
        t=t,
        r=r,
        sigma=sigma,
        option_type=option_type,
        contract_symbol=row["contractSymbol"],
    )
    
    factor = 1 if side == "long" else -1
    
    greeks_position = OptionGreeks(
        contractSymbol=greeks_long.contractSymbol,
        strike=greeks_long.strike,
        delta=np.round(greeks_long.delta * factor, 3),
        gamma=np.round(greeks_long.gamma * factor, 3),
        theta=np.round(greeks_long.theta * factor, 3),
        vega=np.round(greeks_long.vega * factor, 3),
        rho=np.round(greeks_long.rho * factor, 3),
    )
    
    
    ##rango de spot
    if spot_min is  None:
        spot_min = spot * 0.5
    if spot_max is None:
        spot_max = spot * 1.5
    spot_range = np.linspace(spot_min, spot_max, num=50)
    
    if option_type == "call":
        intrinsic_value = np.maximum(spot_range - Strike, 0)
    else:  # put
        intrinsic_value = np.maximum(Strike - spot_range, 0)
        
    if side == "long":
        payoff = intrinsic_value 
        profit = intrinsic_value - premium
    else:  # short
        payoff = -intrinsic_value
        profit = premium - intrinsic_value  
    # Ajustar a valor por contrato (multiplicar por 100)
    payoff = np.round((payoff * 100), 3).tolist()
    profit = np.round((profit * 100), 3).tolist()

    return OptionPayoff(
        underlying=underlying,
        expiration=expiration,
        strike=Strike,
        side=side,
        option_type=option_type,
        premium=premium,
        spot_current=spot,
        spot_prices=np.round(spot_range, 3).tolist(),
        payoffs=payoff,
        profits=profit,
        greeks=greeks_position,
    )