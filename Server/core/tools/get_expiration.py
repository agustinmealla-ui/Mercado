from typing import List
from datetime import date
import yfinance as yf
from Server.model.options import GetOptionExpirations

def get_option_expiration(underlying: str) -> GetOptionExpirations:
    '''
    Obtener las fechas de vencimiento de las opciones para un subyacente dado.
    :param underlying: Ticker del activo subyacente.
    :type underlying: str
    :return: Lista de fechas de vencimiento.
    :rtype: List[date]
    '''
    
    t = yf.Ticker(underlying)
    
    Expirations: List[str] = list(t.options)
    
    return GetOptionExpirations(
        underlying=underlying,
        expirations=Expirations,
        count=len(Expirations)
    )

