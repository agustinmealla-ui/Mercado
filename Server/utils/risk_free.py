from dotenv import load_dotenv
from typing import Dict
from datetime import date
import os
import requests

load_dotenv()
key = os.getenv("FRED_API_KEY")

FRED_SERIES: Dict[str, str] = {
    "1MO": "DGS1MO",
    "3MO": "DGS3MO",
    "6MO": "DGS6MO",
    "1Y":  "DGS1",
    "2Y":  "DGS2",
    "3Y":  "DGS3",
    "5Y":  "DGS5",
    "7Y":  "DGS7",
    "10Y": "DGS10",
    "20Y": "DGS20",
    "30Y": "DGS30",
}

MATURITY_YEARS: Dict[str, float] = {
    "DGS1MO": 1/12,
    "DGS3MO": 3/12,
    "DGS6MO": 6/12,
    "DGS1":   1.0,
    "DGS2":   2.0,
    "DGS3":   3.0,
    "DGS5":   5.0,
    "DGS7":   7.0,
    "DGS10": 10.0,
    "DGS20": 20.0,
    "DGS30": 30.0,
}

def _download_last_yield(series_id: str) -> float:
    """Descarga el último valor disponible de una serie FRED."""
    
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": key,
        "file_type": "json",
        "limit": 1,
        "sort_order": "desc",
    }

    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        raw_value = data["observations"][0]["value"]

        # FRED a veces devuelve "."
        if raw_value == ".":
            raise ValueError(f"Valor vacío para serie {series_id}")

        return float(raw_value) / 100
    
    except Exception as e:
        raise RuntimeError(f"Error al descargar datos de FRED ({series_id}): {e}")
from datetime import date, datetime

def get_risk_free_rate(expiration: str) -> float:
    """
    Obtiene la tasa libre de riesgo interpolada para una fecha de expiración determinada.
    
    :param expiration: Fecha de vencimiento en formato 'YYYY-MM-DD'.
    :return: Tasa libre de riesgo anualizada (float).
    """

    # 1) Parsear el string a date
    try:
        expiration_date = datetime.strptime(expiration, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("La fecha de vencimiento debe tener formato 'YYYY-MM-DD'.")

    valuation_date = date.today()

    if expiration_date <= valuation_date:
        raise ValueError("La fecha de vencimiento debe ser posterior a hoy.")

    years_to_expiration = (expiration_date - valuation_date).days / 365.0

    points_x = []
    points_y = []

    for _, series_id in FRED_SERIES.items():
        rate = _download_last_yield(series_id)
        maturity = MATURITY_YEARS[series_id]

        points_x.append(maturity)
        points_y.append(rate)

    # Ordenar por madurez
    paired = sorted(zip(points_x, points_y))
    x_vals = [p[0] for p in paired]
    y_vals = [p[1] for p in paired]

    # Fuera del rango: extrapolación constante
    if years_to_expiration <= x_vals[0]:
        return y_vals[0]
    if years_to_expiration >= x_vals[-1]:
        return y_vals[-1]

    # Interpolación lineal correcta
    for i in range(len(x_vals) - 1):
        x0, x1 = x_vals[i], x_vals[i+1]
        y0, y1 = y_vals[i], y_vals[i+1]

        if x0 <= years_to_expiration <= x1:
            slope = (y1 - y0) / (x1 - x0)
            rate = y0 + slope * (years_to_expiration - x0)
            return round(rate, 6)

    # (Opcional) por si algo raro pasa:
    raise RuntimeError("No se pudo interpolar la tasa.")
