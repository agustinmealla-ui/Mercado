import sys
from pathlib import Path
import math
import pprint
import matplotlib.pyplot as plt

# Ajusta esta ruta si es necesario
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from Server.core.tools.greeks import compute_greeks_chain


def print_greeks_response(greeks):
    """
    Imprime la estructura Greeks en un formato legible.
    """
    print("\n========================")
    print("  FORMATO DE RESPUESTA")
    print("========================\n")

    print(f"Underlying: {greeks.underlying}")
    print(f"Expiration: {greeks.expiration}")

    print("\n--- CALLS ---")
    for c in greeks.calls[:10]:   # limitar a 10 para no imprimir 200 líneas
        pprint.pprint({
            "contractSymbol": c.contractSymbol,
            "strike": c.strike,
            "delta": c.delta,
            "gamma": c.gamma,
            "theta": c.theta,
            "vega": c.vega,
            "rho": c.rho,
        })

    print("\n--- PUTS ---")
    for p in greeks.puts[:10]:
        pprint.pprint({
            "contractSymbol": p.contractSymbol,
            "strike": p.strike,
            "delta": p.delta,
            "gamma": p.gamma,
            "theta": p.theta,
            "vega": p.vega,
            "rho": p.rho,
        })

    print("\n(Nota: Mostrando solo las primeras 10 CALLS y PUTS)\n")


def plot_all_greeks_vs_strike(underlying: str, expiration: str) -> None:
    greeks = compute_greeks_chain(underlying, expiration)

    # Mostrar formato de respuesta
    print_greeks_response(greeks)

    # ---------- CALLS ----------
    call_data = [
        (c.strike, c.delta, c.gamma, c.theta, c.vega, c.rho)
        for c in greeks.calls
        if not any(
            v is None or (isinstance(v, float) and math.isnan(v))
            for v in [c.delta, c.gamma, c.theta, c.vega, c.rho]
        )
    ]

    call_data.sort(key=lambda x: x[0])

    if call_data:
        call_strike, call_delta, call_gamma, call_theta, call_vega, call_rho = zip(*call_data)
    else:
        call_strike = call_delta = call_gamma = call_theta = call_vega = call_rho = []

    # ---------- PUTS ----------
    put_data = [
        (p.strike, p.delta, p.gamma, p.theta, p.vega, p.rho)
        for p in greeks.puts
        if not any(
            v is None or (isinstance(v, float) and math.isnan(v))
            for v in [p.delta, p.gamma, p.theta, p.vega, p.rho]
        )
    ]

    put_data.sort(key=lambda x: x[0])

    if put_data:
        put_strike, put_delta, put_gamma, put_theta, put_vega, put_rho = zip(*put_data)
    else:
        put_strike = put_delta = put_gamma = put_theta = put_vega = put_rho = []

    # ---------- PLOTS ----------
    fig, axes = plt.subplots(5, 1, figsize=(12, 18), sharex=True)
    fig.suptitle(f"Greeks vs Strike - {underlying} {expiration}")

    # Delta
    ax = axes[0]
    if call_data:
        ax.plot(call_strike, call_delta, marker="o", linestyle="-", label="Calls")
    if put_data:
        ax.plot(put_strike, put_delta, marker="x", linestyle="--", label="Puts")
    ax.set_ylabel("Delta")
    ax.grid(True)
    ax.legend()

    # Gamma
    ax = axes[1]
    if call_data:
        ax.plot(call_strike, call_gamma, marker="o", linestyle="-", label="Calls")
    if put_data:
        ax.plot(put_strike, put_gamma, marker="x", linestyle="--", label="Puts")
    ax.set_ylabel("Gamma")
    ax.grid(True)
    ax.legend()

    # Theta
    ax = axes[2]
    if call_data:
        ax.plot(call_strike, call_theta, marker="o", linestyle="-", label="Calls")
    if put_data:
        ax.plot(put_strike, put_theta, marker="x", linestyle="--", label="Puts")
    ax.set_ylabel("Theta")
    ax.grid(True)
    ax.legend()

    # Vega
    ax = axes[3]
    if call_data:
        ax.plot(call_strike, call_vega, marker="o", linestyle="-", label="Calls")
    if put_data:
        ax.plot(put_strike, put_vega, marker="x", linestyle="--", label="Puts")
    ax.set_ylabel("Vega")
    ax.grid(True)
    ax.legend()

    # Rho
    ax = axes[4]
    if call_data:
        ax.plot(call_strike, call_rho, marker="o", linestyle="-", label="Calls")
    if put_data:
        ax.plot(put_strike, put_rho, marker="x", linestyle="--", label="Puts")
    ax.set_ylabel("Rho")
    ax.set_xlabel("Strike")
    ax.grid(True)
    ax.legend()

    plt.tight_layout(rect=[0, 0, 1, 0.97])
    plt.show()


# EJEMPLO DE USO
plot_all_greeks_vs_strike("SPY", "2025-12-26")

