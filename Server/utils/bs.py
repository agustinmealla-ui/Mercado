from math import log, sqrt, exp
from scipy.stats import norm
from ..model.options import OptionGreeks
 
def d1(S: float, K: float, t: float, r: float, sigma: float) -> float:
    """Calcula el valor de d1 en el modelo Black-Scholes."""
    return (log(S / K) + (r + 0.5 * sigma ** 2) * t) / (sigma * sqrt(t))

def _d2(S: float, K: float, t: float, r: float, sigma: float) -> float:
    return d1(S, K, t, r, sigma) - sigma * sqrt(t)

def N_d1(d1: float) -> float:
    """Función de distribución acumulativa normal para d1."""
    return norm.cdf(d1)

def N_d2(d2: float) -> float:
    """Función de distribución acumulativa normal para d2."""
    return norm.cdf(d2)

def bs_price_sigma(S: float, K: float, t: float, r: float, option_type: str, sigma: float) -> float:
    
    if option_type.lower() == "call":
        return S * N_d1(d1(S, K, t, r, sigma)) - K * exp(-r * t) * N_d2(_d2(S, K, t, r, sigma))
    elif option_type.lower() == "put":
        return K * exp(-r * t) * N_d2(-_d2(S, K, t, r, sigma)) - S * N_d1(-d1(S, K, t, r, sigma))
    
def black_scholes_vega(S,K,t,r,sigma) -> float:
    """Calcula la Vega de una opción utilizando el modelo Black-Scholes."""
    return S * norm.pdf(d1(S, K, t, r, sigma)) * sqrt(t) 

def implied_volatility(
    S, K, t, r, Price, option_type,
    sigma=0.2,
    tol=1e-6,
    max_iter=100,
):
    """
    Calculate implied volatility using Newton-Raphson method.
    """
    i = 0
    while i < max_iter:  
        est = bs_price_sigma(S, K, t, r, option_type, sigma)

        vega = black_scholes_vega(S, K, t, r, sigma)
        diff = Price - est
        
        if abs(diff) < tol:
            return sigma
        
        if vega < 1e-10:  
            break
            
        sigma = sigma + (diff / vega)
        i += 1
    return None  

def black_scholes_delta(S, K, t, r, sigma, option_type) -> float:
    """Calcula la Delta de una opción utilizando el modelo Black-Scholes."""
    d1_val = d1(S, K, t, r, sigma)
    return N_d1(d1_val) if option_type.lower() == "call" else N_d1(d1_val) - 1

def black_scholes_gamma(S, K, t, r, sigma) -> float:
    """Calcula la Gamma de una opción utilizando el modelo Black-Scholes."""
    d_1 = d1(S, K, t, r, sigma)
    return norm.pdf(d_1) / (S * sigma * sqrt(t))

def black_scholes_theta(S: float, K: float, t: float, r: float, sigma: float, option_type: str) -> float:
    """Calcula la Theta de una opción (por día) utilizando el modelo Black-Scholes."""
    opt = option_type.lower()
    if opt not in ("call", "put"):
        raise ValueError("option_type debe ser 'call' o 'put'.")

    d_1 = d1(S, K, t, r, sigma)
    d_2 = _d2(S, K, t, r, sigma)

    first_term = -(S * norm.pdf(d_1) * sigma) / (2 * sqrt(t))

    if opt == "call":
        theta = first_term - r * K * exp(-r * t) * N_d2(d_2)
    else:  # put
        theta = first_term + r * K * exp(-r * t) * N_d2(-d_2)

    # De anual a diario (aprox. 365 días)
    return theta / 365.0

def black_scholes_rho(S: float, K: float, t: float, r: float, sigma: float, option_type: str) -> float:
    """Calcula la Rho de una opción utilizando el modelo Black-Scholes."""
    opt = option_type.lower()
    if opt not in ("call", "put"):
        raise ValueError("option_type debe ser 'call' o 'put'.")

    d_2 = _d2(S, K, t, r, sigma)

    if opt == "call":
        return K * t * exp(-r * t) * N_d2(d_2)
    else:  # put
        return -K * t * exp(-r * t) * N_d2(-d_2)
    

def compute_greeks(
    S: float,
    K: float,
    t: float,
    r: float,
    sigma: float,
    option_type: str,
    contract_symbol: str | None = None
) -> OptionGreeks:
    """Calcula las griegas de una opción utilizando el modelo Black-Scholes."""
    delta = black_scholes_delta(S, K, t, r, sigma, option_type)
    gamma = black_scholes_gamma(S, K, t, r, sigma)
    theta = black_scholes_theta(S, K, t, r, sigma, option_type)
    vega = black_scholes_vega(S, K, t, r, sigma)
    rho = black_scholes_rho(S, K, t, r, sigma, option_type)
    
    nd = 5
    return OptionGreeks(
        contractSymbol=contract_symbol,
        strike=K,
        delta=round(delta, nd),
        gamma=round(gamma, nd),
        theta=round(theta, nd),
        vega=round(vega, nd),
        rho=round(rho, nd),
    )
    