from ...model.options import Greeks, OptionGreeks
from ...utils.get_spot import get_spot_price
from ...utils.risk_free import get_risk_free_rate
from datetime import date
import yfinance as yf
from ...utils.bs import     compute_greeks, implied_volatility

def compute_greeks_chain(underlying: str, expiration: str) -> Greeks:
    """
    Calcula las griegas (Delta, Gamma, Theta, Vega, Rho) para todas las opciones
    de un activo subyacente en una fecha de vencimiento específica utilizando el modelo Black-Scholes.

    Args:
        underlying (str): Ticker del activo subyacente (ej: "AAPL", "TSLA", "SPY")
        expiration (str): Fecha de vencimiento en formato "YYYY-MM-DD"

    Returns:
        Greeks: Objeto que contiene las griegas calculadas para cada opción
    """
    
    S = get_spot_price(underlying)
    ticker = yf.Ticker(underlying)
    
    if expiration not in ticker.options:
        raise ValueError(f"La fecha de vencimiento {expiration} no está disponible, para el subyacente {underlying}. Las fechas disponibles son: {ticker.options}")
   
    r = get_risk_free_rate(expiration)
    as_of = date.today()
    
    t = (date.fromisoformat(expiration) - as_of).days / 365.0
    
    
    chain = ticker.option_chain(expiration)
    
    calls_df = chain.calls
    puts_df = chain.puts
    
    calls: list[OptionGreeks] = []
    puts: list[OptionGreeks] = []
    
    for _, row in calls_df.iterrows():
        K = row["strike"]
        bid = row["bid"]
        ask = row["ask"]
        last = row["lastPrice"]

    # 1) Precio de referencia: mid si se puede, sino last
        price = None
        if bid is not None and ask is not None and bid > 0 and ask > 0:
            price = (bid + ask) / 2
        elif last is not None and last > 0:
            price = last


    # 2) Intentamos calcular IV con BS
        sigma = implied_volatility(
            S=S,
            K=K,
            t=t,
            r=r,
            Price=price,
            option_type="call",
    )

    # 3) Si el solver no converge, fallback a la IV de yfinance de ESA fila
        if sigma is None or sigma <= 0:
            iv_yf = row.get("impliedVolatility")
        
            sigma = iv_yf
        
        calls.append(
            compute_greeks(
                S=S,
                K=K,
                t=t,
                r=r,
                sigma=sigma,
                option_type="call",
                contract_symbol=row["contractSymbol"],
            )
        )
        
    for _, row in puts_df.iterrows():
        K = row['strike']
        bid = row["bid"]
        ask = row["ask"]
        last = row["lastPrice"]

        if bid and ask and bid > 0 and ask > 0:
            price = (bid + ask) / 2
        else:
            price = last
        sigma = implied_volatility(
        S=S,
        K=K,
        t=t,
        r=r,
        Price=price,
        option_type="put",
    )
        
        if sigma is None or sigma <= 0:
            sigma = row["impliedVolatility"]

        
        puts.append(
            compute_greeks(
                S=S,
                K=K,
                t=t,
                r=r,
                sigma=sigma,
                option_type="put",
                contract_symbol=row["contractSymbol"],
            )
        )
        
    return Greeks(
        underlying=underlying,
        expiration=expiration,
        calls=calls,
        puts=puts,
    )