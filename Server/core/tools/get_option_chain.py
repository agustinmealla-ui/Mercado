import yfinance as yf
from Server.model.options import Option_Chain, OptionQuote
from Server.utils.get_spot import get_spot_price
from datetime import date
from ...utils.option_quote import row_to_option_quote
from typing import List
def get_option_chain(underlying: str, expiration: str) -> Option_Chain:
    """
    Obtiene la cadena completa de opciones (calls y puts) para un activo subyacente y fecha de vencimiento.
    
    Esta función recupera todas las opciones call y put disponibles para un ticker específico
    en una fecha de vencimiento determinada, incluyendo información del spot price, moneda,
    y fecha de valoración.
    
    Args:
        underlying (str): Ticker del activo subyacente (ej: "AAPL", "TSLA", "SPY")
        expiration (str): Fecha de vencimiento en formato "YYYY-MM-DD"
    
    Returns:
        Option_Chain: Objeto que contiene:
            - underlying: Ticker del activo
            - long_name: Nombre completo del activo
            - currency: Moneda del activo
            - expiration: Fecha de vencimiento solicitada
            - as_of: Fecha de valoración (hoy)
            - spot: Precio spot actual del subyacente
            - calls: Lista de OptionQuote con todas las opciones call
            - puts: Lista de OptionQuote con todas las opciones put
    
    Raises:
        ValueError: Si la fecha de vencimiento no está disponible para el subyacente
    
    Example:
        >>> chain = get_option_chain("AAPL", "2024-12-20")
        >>> print(f"Calls: {len(chain.calls)}, Puts: {len(chain.puts)}")
        >>> print(f"Spot: ${chain.spot}")
    """
    t = yf.Ticker(underlying)
    spot = get_spot_price(underlying)
    
    valuation_Date = date.today()
    
    raw_exp = t.options
    
    if expiration in raw_exp:
        exp_str = expiration
    else:
        raise ValueError(f"Fecha de expiración {expiration} no encontrada para el subyacente {underlying}. Fechas de expiración disponibles: {raw_exp}")
    
    currency = t.info['financialCurrency']
    long_name = t.info['longName']
    
    calls: List[OptionQuote] = []
    puts: List[OptionQuote] = []
    
    
    for _, row in t.option_chain(exp_str).calls.iterrows():
        call_quote = row_to_option_quote(row)
        calls.append(call_quote)
    
    for _, row in t.option_chain(exp_str).puts.iterrows():
        put_quote = row_to_option_quote(row)
        puts.append(put_quote)
    
    return Option_Chain(
        underlying=underlying,
        long_name=long_name,
        currency=currency,
        expiration=expiration,
        as_of=valuation_Date,
        spot=spot,
        calls=calls,
        puts=puts)