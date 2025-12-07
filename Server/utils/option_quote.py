from ..model.options import OptionQuote

def row_to_option_quote(row) -> OptionQuote:
    """
    Convierte una fila de datos de yfinance a un objeto OptionQuote.
    
    Args:
        row: Fila de DataFrame de yfinance con datos de una opción
        
    Returns:
        OptionQuote con los datos formateados de la opción
    """
    ltd = row.get('lastTradeDate').strftime("%Y-%m-%d %H:%M")
    
    return OptionQuote(
        contractSymbol=row['contractSymbol'],
        lastTradeDate=ltd,
        strike=row['strike'],
        lastPrice=row['lastPrice'],
        bid=row['bid'],
        ask=row['ask'],
        mid=(row['bid'] + row['ask']) / 2,
        volume=row['volume'],
        openInterest=row['openInterest'],
        intheMoney=row['inTheMoney']
    )




