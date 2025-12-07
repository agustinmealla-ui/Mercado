import yfinance as yf

def get_spot_price(underlying: str) -> float:
    '''
    Obtener el precio spot (precio de cierre más reciente) de un activo subyacente dado.
    :param underlying: Ticker del activo subyacente.
    :type underlying: str
    :return: Precio spot del activo subyacente.
    :rtype: float
    '''
    t = yf.Ticker(underlying)
    hist = t.history(period="1d")
    spot = hist['Close'].iloc[-1]
    spot = round(spot, 3)
    
    return spot