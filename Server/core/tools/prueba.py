import sys
import os
# Add the MERCADO directory to sys.path to enable importing Server
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

import yfinance as yf
from datetime import datetime
import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.interpolate import interp1d

from Server.utils.bs import implied_volatility, bs_price_sigma
from Server.utils.get_spot import get_spot_price
from Server.utils.risk_free import get_risk_free_rate

def get_implied_distribution_debug(
    underlying: str,
    expiration: str,
    min_moneyness: float = 0.7,
    max_moneyness: float = 1.3,
    debug: bool = True,
):
    """ImpliedDistribution (versión debug)"""

    def dprint(*args, **kwargs):
        if debug:
            print(*args, **kwargs)

    dprint("=== get_implied_distribution_debug ===")
    dprint(f"Underlying: {underlying}")
    dprint(f"Expiration (input): {expiration}")
    dprint(f"Moneyness range: [{min_moneyness}, {max_moneyness}]")

    ticker = yf.Ticker(underlying)

    dprint("Fechas de opciones disponibles:", ticker.options)
    if expiration not in ticker.options:
        raise ValueError(
            f"Fecha {expiration} no encontrada para {underlying}. "
            f"Fechas disponibles: {ticker.options}"
        )

    r = get_risk_free_rate(expiration)
    spot = get_spot_price(underlying)

    dprint(f"Spot: {spot}")
    dprint(f"Tasa libre de riesgo (r): {r}")

    expiration_dt = datetime.fromisoformat(expiration)
    today = datetime.today()
    dprint(f"Hoy: {today}")
    dprint(f"Expiration datetime: {expiration_dt}")

    dte = (expiration_dt - today).days
    if dte <= 0:
        raise ValueError(f"La expiración {expiration} ya pasó o es hoy. DTE={dte}")

    t = dte / 252
    dprint(f"DTE: {dte} días | t (años 252): {t}")

    # Obtener cadena de opciones
    chain = ticker.option_chain(expiration_dt.strftime("%Y-%m-%d"))
    calls_df = chain.calls.copy()

    dprint("Total de calls en la cadena:", len(calls_df))

    # Mid entre bid/ask o lastPrice como fallback
    valid_quotes = (calls_df["bid"] > 0) & (calls_df["ask"] > 0)
    mid_from_quotes = (calls_df["bid"] + calls_df["ask"]) / 2

    calls_df["Mid"] = np.where(
        valid_quotes,
        mid_from_quotes,
        calls_df.get("lastPrice", np.nan),
    )

    dprint(f"Quotes válidos (bid/ask > 0): {valid_quotes.sum()} de {len(calls_df)}")
    dprint("Nº de Mid NaN:", calls_df["Mid"].isna().sum())

    # Filtrar por moneyness
    calls_df["moneyness"] = calls_df["strike"] / spot
    before_filter = len(calls_df)
    calls_df = calls_df[
        (calls_df["moneyness"] >= min_moneyness)
        & (calls_df["moneyness"] <= max_moneyness)
    ]
    after_filter = len(calls_df)

    dprint(
        f"Calls antes del filtro de moneyness: {before_filter}, "
        f"después: {after_filter}"
    )

    if after_filter == 0:
        raise ValueError(
            "No se encontraron opciones call dentro del rango de moneyness especificado."
        )

    iv_calls = []
    valid_strikes = []

    # Cálculo de IV por strike, con try/except
    for idx, row in calls_df.iterrows():
        K = float(row["strike"])
        price_mid = float(row["Mid"])

        if np.isnan(price_mid) or price_mid <= 0:
            dprint(f"[SKIP] Strike {K}: Mid inválido ({price_mid})")
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
            dprint(f"[ERROR IV] Strike {K}, Mid={price_mid}: {e}")
            continue

        if sigma is None or np.isnan(sigma) or sigma <= 0:
            dprint(f"[SKIP] Strike {K}: IV inválida ({sigma})")
            continue

        iv_calls.append({"strike": K, "implied_volatility": sigma})
        valid_strikes.append(K)

    dprint("Strikes válidos tras IV:", len(iv_calls))

    if len(iv_calls) < 3:
        raise ValueError(
            "Menos de 3 strikes con IV válida. No se puede construir distribución fiable."
        )

    strikes = np.array([x["strike"] for x in iv_calls], dtype=float)
    iv = np.array([x["implied_volatility"] for x in iv_calls], dtype=float)

    dprint("Rango de strikes usados para IV:")
    dprint(f"  min(K): {strikes.min()}, max(K): {strikes.max()}")
    dprint(f"  IV media: {iv.mean()}, IV min: {iv.min()}, IV max: {iv.max()}")

    # Suavizar IV
    iv = gaussian_filter1d(iv, sigma=2)
    dprint("IV suavizada (primeros 5 valores):", iv[:5])

    # Crear rango de strikes interpolados
    Ks_range = np.arange(
        start=strikes.min(),
        stop=strikes.max(),
        step=0.01,
    )
    dprint("Cantidad de puntos en Ks_range:", len(Ks_range))

    # Interpolar IV en el nuevo rango de strikes
    f = interp1d(
        x=strikes,
        y=iv,
        kind="cubic",
        fill_value="extrapolate",
        bounds_error=False,
    )
    iv_interp = f(Ks_range)
    dprint("IV interpolada (primeros 5 valores):", iv_interp[:5])

    # Calcular precios de opciones call con IV interpolada
    calls_p = np.array(
        [
            bs_price_sigma(
                S=spot,
                K=K,
                t=t,
                r=r,
                option_type="call",
                sigma=sigma,
            )
            for K, sigma in zip(Ks_range, iv_interp)
        ]
    )

    dprint("Calls teóricos (primeros 5):", calls_p[:5])

    # Calcular PDF usando Breeden-Litzenberger
    # OJO: edge_order debe ser 1 o 2 en np.gradient, no 0
    first_deriv = np.gradient(calls_p, Ks_range, edge_order=1)
    second_deriv = np.gradient(first_deriv, Ks_range, edge_order=1)

    pdf = np.exp(r * t) * second_deriv

    dprint("PDF sin post-proceso (primeros 5):", pdf[:5])

    # Suavizado y recorte a valores >= 0
    pdf = gaussian_filter1d(pdf, sigma=2)
    pdf = np.maximum(pdf, 0)

    # Normalizar PDF
    total_prob = np.trapz(pdf, Ks_range)
    dprint("Probabilidad total antes de normalizar (trapz):", total_prob)

    if total_prob <= 0 or np.isnan(total_prob):
        raise ValueError(
            f"Probabilidad total no válida tras Breeden-Litzenberger: {total_prob}"
        )

    pdf /= total_prob

    dprint("Probabilidad total después de normalizar:", np.trapz(pdf, Ks_range))

    # Probabilidad de estar debajo/encima del spot
    mask_down = Ks_range <= spot
    mask_up = Ks_range > spot

    prob_down = np.trapz(pdf[mask_down], Ks_range[mask_down])
    prob_up = np.trapz(pdf[mask_up], Ks_range[mask_up])

    dprint(f"Prob. debajo spot: {prob_down}")
    dprint(f"Prob. encima spot: {prob_up}")
    dprint("Prob. abajo + arriba:", prob_down + prob_up)

    # Media
    mean = np.trapz(Ks_range * pdf, Ks_range)
    # Varianza
    variance = np.trapz((Ks_range - mean) ** 2 * pdf, Ks_range)
    std = np.sqrt(variance)

    dprint(f"Media: {mean}, Std: {std}")

    mu3 = np.trapz((Ks_range - mean) ** 3 * pdf, Ks_range)
    mu4 = np.trapz((Ks_range - mean) ** 4 * pdf, Ks_range)

    skewness = mu3 / std**3 if std > 0 else np.nan
    kurtosis = mu4 / std**4 if std > 0 else np.nan

    dprint(f"Skewness: {skewness}, Kurtosis: {kurtosis}")

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

    dprint(f"Q1: {q1}, Median: {q2}, Q3: {q3}")

    iqr = q3 - q1
    bowley_skewness = (q3 + q1 - 2 * q2) / iqr if iqr != 0 else np.nan

    Var_95 = quantile(0.05)
    var_95_loss = spot - Var_95

    dprint(f"VaR 95% (nivel): {Var_95}, VaR 95% (pérdida): {var_95_loss}")

    # Agrupación en intervalos de 1 dólar
    min_k = np.floor(Ks_range.min())
    max_k = np.ceil(Ks_range.max())

    bin_edges = np.arange(min_k, max_k + 1, 1)
    prob_bins, _ = np.histogram(Ks_range, bins=bin_edges, weights=pdf)
    bin_centers = 0.5 * (bin_edges[:-1] + bin_edges[1:])

    dprint("Número de bins:", len(bin_centers))
    dprint("Suma prob_bins:", prob_bins.sum())

    distribution_summary = [
        {"strike_bin": float(center), "probability": float(prob)}
        for center, prob in zip(bin_centers, prob_bins)
    ]

    result = {
        "expiration": expiration_dt.strftime("%Y-%m-%d"),
        "underlying": underlying,
        "strikes": [round(float(K), 2) for K in valid_strikes],
        "spot": round(float(spot), 2),
        "DTE": dte,
        "risk_free_rate": round(float(r), 6),
        "mean": round(float(mean), 4),
        "std_dev": round(float(std), 4),
        "skewness": round(float(skewness), 4) if not np.isnan(skewness) else None,
        "kurtosis": round(float(kurtosis), 4) if not np.isnan(kurtosis) else None,
        "quantile_25": round(float(q1), 4),
        "quantile_50": round(float(q2), 4),
        "quantile_75": round(float(q3), 4),
        "bowley_skewness": (
            round(float(bowley_skewness), 4)
            if not np.isnan(bowley_skewness)
            else None
        ),
        "VaR_95": round(float(Var_95), 4),
        "VaR_95_loss": round(float(var_95_loss), 4),
        "probability_below_spot": round(float(prob_down), 6),
        "probability_above_spot": round(float(prob_up), 6),
        "distribution_summary": distribution_summary,
    }

    dprint("=== FIN get_implied_distribution_debug ===")
    return result

def test_get_implied_distribution_debug():
    # Sample parameters for testing
    underlying = "AAPL"
    expiration = "2025-12-26"  # Adjust to a valid expiration date for AAPL

    result = get_implied_distribution_debug(
        underlying=underlying,
        expiration=expiration,
        min_moneyness=0.7,
        max_moneyness=1.3,
        debug=True
    )

    print("\n--- Test Results ---")
    print(f"Underlying: {result['underlying']}")
    print(f"Expiration: {result['expiration']}")
    print(f"Spot: {result['spot']}")
    print(f"Mean: {result['mean']}")
    print(f"Std Dev: {result['std_dev']}")
    print(f"Skewness: {result['skewness']}")
    print(f"Kurtosis: {result['kurtosis']}")
    print(f"Probability below spot: {result['probability_below_spot']}")
    print(f"Probability above spot: {result['probability_above_spot']}")

if __name__ == "__main__":
    test_get_implied_distribution_debug()
