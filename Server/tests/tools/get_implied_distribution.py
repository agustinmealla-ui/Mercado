import sys
import os
import numpy as np
import matplotlib.pyplot as plt
# Add the MERCADO directory to sys.path to enable importing Server
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from Server.core.tools.get_implied_distribution import get_implied_distribution
 # ajusta el import


def test_implied_distribution():
    underlying = "MSFT"          # o el que uses
    expiration = "2025-12-26"    # Asegurate que exista en yfinance

    result = get_implied_distribution(
        underlying=underlying,
        expiration=expiration,
        min_moneyness=0.7,
        max_moneyness=1.5,

    )

    # Extraer datos de distribution_summary para graficar
    bins = np.array([d["strike_bin"] for d in result.distribution_summary])
    probs = np.array([d["probability"] for d in result.distribution_summary])

    # Para graficar como PDF continua, normalizamos por el ancho del bin
    bin_width = bins[1] - bins[0] if len(bins) > 1 else 1
    pdf_values = probs / bin_width

    # Gráfico del PDF continuo
    plt.figure(figsize=(10, 6))
    plt.bar(bins, pdf_values, width=0.9 * bin_width, alpha=0.6, label="PDF Implícita")
    plt.axvline(result.spot, color="red", linestyle="--", label=f"Spot = {result.spot}")
    plt.title(f"Distribución Implícita de Precios – {result.underlying} {result.expiration}")
    plt.xlabel("Strike")
    plt.ylabel("Densidad de probabilidad")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()

    print("\n--- RESUMEN ---")
    print(f"mean: {result.mean}")
    print(f"std_dev: {result.std_dev}")
    print(f"skewness: {result.skewness}")
    print(f"kurtosis: {result.kurtosis}")
    print(f"probability_below_spot: {result.probability_below_spot}")
    print(f"probability_above_spot: {result.probability_above_spot}")


if __name__ == "__main__":
    test_implied_distribution()
