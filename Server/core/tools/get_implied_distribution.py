import yfinance as yf
from datetime import datetime
from Server.utils.bs import implied_volatility, bs_price_sigma
import numpy as np
from Server.utils.get_spot import get_spot_price
from Server.utils.risk_free import get_risk_free_rate
from scipy.ndimage import gaussian_filter1d
from scipy.interpolate import interp1d
from Server.model.options import ImpliedDistribution
def get_implied_distribution(underlying: str, expiration: str, min_moneyness: float = 0.7, max_moneyness: float = 1.3) -> ImpliedDistribution:
    '''ImpliedDistribution:
    '''
    ticker = yf.Ticker(underlying)
    
    if expiration not in ticker.options:
        raise ValueError(f"Fecha {expiration} no encontrada para {underlying}. Fechas disponibles: {ticker.options}")
    
    r = get_risk_free_rate(expiration)
    spot = get_spot_price(underlying)

    expiration =  datetime.fromisoformat(expiration)
    dte = (expiration - datetime.today()).days
    t = dte / 252
    
    #Obtener cadena de opciones
    chain = ticker.option_chain(expiration.strftime("%Y-%m-%d"))
    calls_df = chain.calls
    
    
    valid_quotes = (calls_df["bid"] > 0) & (calls_df["ask"] > 0)
    mid_from_quotes = (calls_df["bid"] + calls_df["ask"]) / 2

    # Fallback: usar lastPrice cuando no hay cotización bid/ask decente
    calls_df["Mid"] = np.where(
    valid_quotes,
    mid_from_quotes,
    calls_df.get("lastPrice", np.nan)  # yfinance suele tener lastPrice
    )
    
    #filtrar x moneyness

    calls_df['moneyness'] = calls_df['strike'] / spot
    calls_df = calls_df[(calls_df['moneyness'] >= min_moneyness) & (calls_df['moneyness'] <= max_moneyness)]
    
    iv_calls = []
    valid_strikes = []
    
    for _, row in calls_df.iterrows():
        K = float(row["strike"])
        price_mid = float(row["Mid"])

        if np.isnan(price_mid) or price_mid <= 0:
            continue

        try:
            sigma = implied_volatility(
                S=spot,
                K=K,
                t=t,
                r=r,
                Price=price_mid,
                option_type="call",
            )
        except Exception as e:
            continue

        if sigma is None or np.isnan(sigma) or sigma <= 0:
            continue

        iv_calls.append({"strike": K, "implied_volatility": sigma})
        valid_strikes.append(K)
    
    if len(iv_calls) < 3:
        raise ValueError("No se encontraron opciones call dentro del rango de moneyness especificado.")
    
    strikes = np.array([x["strike"] for x in iv_calls], dtype=float)
    iv  = np.array([x["implied_volatility"] for x in iv_calls], dtype=float)

    
    #suavizar IV
    
    iv = gaussian_filter1d(iv, sigma=2)
    
    #Crear rango de strikes interpolados
    Ks_range = np.arange(
        start = strikes.min(),
        stop = strikes.max(),
        step = 0.01
    )
    
    #Interpolar IV en el nuevo rango de strikes
    f = interp1d(x = strikes, y=iv, kind='cubic', fill_value='extrapolate')
    
    iv_interp = f(Ks_range)
    
    #Calcular precios de opciones call con IV interpolada
    
    calls_p = np.array([
        bs_price_sigma(
            S=spot,
            K=K,
            t=t,
            r=r,
            option_type='call',
            sigma=sigma
        ) for K, sigma in zip(Ks_range, iv_interp)
    ])
    
    #Calcular PDF usando Breeden-Litzenberger
    first_deriv = np.gradient(calls_p, Ks_range, edge_order=0)
    second_deriv = np.gradient(first_deriv, Ks_range, edge_order=0)
    
    pdf = np.exp(r * t) * second_deriv
    pdf = gaussian_filter1d(pdf, sigma=2)
    pdf = np.maximum(pdf, 0)
    
    #Normalizar PDF
     
    total_prob = np.trapz(pdf, Ks_range)
    pdf /= total_prob
    
    #Probabilidad de estar debajo/encima del spot
    
    mask_down = Ks_range <= spot
    prob_down = np.trapz(pdf[mask_down], Ks_range[mask_down])
    mask_up = Ks_range > spot
    prob_up = np.trapz(pdf[mask_up], Ks_range[mask_up])
    
    
    #Media 
    mean = np.trapz(Ks_range * pdf, Ks_range)
    
    #varianza
    variance = np.trapz((Ks_range - mean)**2 * pdf, Ks_range)
    std = np.sqrt(variance)
    
    mu3 = np.trapz((Ks_range - mean)**3 * pdf, Ks_range)
    mu4 = np.trapz((Ks_range - mean)**4 * pdf, Ks_range)

    skewness = mu3 / std**3
    kurtosis = mu4 / std**4

    
    dx = Ks_range[1] - Ks_range[0]
    
    cum_prob = np.cumsum(pdf) * dx
    
    def quantile(q: float) -> float:
        ind = np.searchsorted(cum_prob, q)
        if ind <= 0:
            return Ks_range[0]
        elif ind >= len(Ks_range):
            return Ks_range[-1]
        return Ks_range[ind]
    
    q1 = quantile(0.25)
    q2 = quantile(0.5)
    q3 = quantile(0.75)
    
    iqr = q3 - q1
    bowley_skewness = (q3 + q1 - 2 * q2) / iqr 
    
    Var_95 = quantile(0.05)
    var_95_loss = spot - Var_95
    
    
    #agrupacion en intervalos
    
    # Crear bins de 1 dólar
    min_k = np.floor(Ks_range.min())
    max_k = np.ceil(Ks_range.max())

    bin_edges = np.arange(min_k, max_k + 1, 1)  # distancia entre bins = $1
    
    prob_bins, _ = np.histogram(Ks_range, bins=bin_edges, weights=pdf)

    bin_centers = 0.5 * (bin_edges[:-1] + bin_edges[1:])

    distribution_summary = [
    {"strike_bin": float(center), "probability": float(prob)}
    for center, prob in zip(bin_centers, prob_bins)
]
    result = ImpliedDistribution(
        expiration=expiration.strftime("%Y-%m-%d"),
        underlying=underlying,
        strikes=[round(float(K), 2) for K in valid_strikes],
        spot=round(float(spot), 2),
        dte=dte,
        risk_free_rate=round(float(r), 6),
        mean=round(float(mean), 4),
        std_dev=round(float(std), 4),
        skewness=round(float(skewness), 4),
        kurtosis=round(float(kurtosis), 4),
        quantile_25=round(float(q1), 4),
        quantile_50=round(float(q2), 4),
        quantile_75=round(float(q3), 4),
        bowley_skewness=round(float(bowley_skewness), 4),
        VaR_95=round(float(Var_95), 4),
        VaR_95_loss=round(float(var_95_loss), 4),
        probability_below_spot=round(float(prob_down), 6),
        probability_above_spot=round(float(prob_up), 6),
        distribution_summary=distribution_summary,
    )
    
    return result