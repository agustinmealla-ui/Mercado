# -*- coding: utf-8 -*-
import pytest
from datetime import date, timedelta
import sys
from pathlib import Path

# Add the root directory to the path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from Server.core.tools.compute_payoff import compute_option_payoff
from Server.model.options import OptionPayoff, OptionGreeks


def test_long_call_payoff(capsys):
    """Test para un long call sobre AAPL."""
    # Usar una fecha futura (30 dias)
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="long",
        option_type="call",
        underlying="AAPL",
        Strike=230.0,
        expiration=expiration,
    )

    # Verificar tipos
    assert isinstance(result, OptionPayoff)
    assert isinstance(result.greeks, OptionGreeks)

    # Verificar campos basicos
    assert result.underlying == "AAPL"
    assert result.strike == 230.0
    assert result.side == "long"
    assert result.option_type == "call"
    assert result.expiration == expiration

    # Verificar que premium es positivo
    assert result.premium > 0

    # Verificar que spot_current existe y es positivo
    assert result.spot_current > 0

    # Verificar arrays
    assert isinstance(result.spot_prices, list)
    assert isinstance(result.payoffs, list)
    assert isinstance(result.profits, list)
    assert len(result.spot_prices) == 50
    assert len(result.payoffs) == 50
    assert len(result.profits) == 50

    # Verificar que los arrays son numericos
    assert all(isinstance(x, (int, float)) for x in result.spot_prices)
    assert all(isinstance(x, (int, float)) for x in result.payoffs)
    assert all(isinstance(x, (int, float)) for x in result.profits)

    # Verificar Greeks
    assert hasattr(result.greeks, 'delta')
    assert hasattr(result.greeks, 'gamma')
    assert hasattr(result.greeks, 'theta')
    assert hasattr(result.greeks, 'vega')
    assert hasattr(result.greeks, 'rho')

    # Para long call, delta debe estar entre 0 y 1
    assert 0 <= result.greeks.delta <= 1

    with capsys.disabled():
        print(f"\nLong Call AAPL")
        print(f"  Strike: ${result.strike}")
        print(f"  Premium: ${result.premium}")
        print(f"  Spot actual: ${result.spot_current:.2f}")
        print(f"  Delta: {result.greeks.delta:.3f}")
        print(f"  Rango de precios: ${result.spot_prices[0]:.2f} - ${result.spot_prices[-1]:.2f}")


def test_long_put_payoff(capsys):
    """Test para un long put sobre AAPL."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="long",
        option_type="put",
        underlying="AAPL",
        Strike=220.0,
        expiration=expiration,
    )

    # Verificar tipos
    assert isinstance(result, OptionPayoff)
    assert result.option_type == "put"
    assert result.side == "long"

    # Para long put, delta debe estar entre -1 y 0
    assert -1 <= result.greeks.delta <= 0

    with capsys.disabled():
        print(f"\nLong Put AAPL")
        print(f"  Strike: ${result.strike}")
        print(f"  Premium: ${result.premium}")
        print(f"  Delta: {result.greeks.delta:.3f}")


def test_short_call_payoff(capsys):
    """Test para un short call sobre AAPL."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="short",
        option_type="call",
        underlying="AAPL",
        Strike=240.0,
        expiration=expiration,
    )

    # Verificar que es short
    assert result.side == "short"

    # Para short call, delta debe ser negativo (entre -1 y 0)
    assert -1 <= result.greeks.delta <= 0

    # El payoff maximo debe ser limitado (el premium multiplicado por 100)
    max_profit = max(result.profits)
    assert max_profit <= result.premium * 100 * 1.01  # 1% de tolerancia

    with capsys.disabled():
        print(f"\nShort Call AAPL")
        print(f"  Strike: ${result.strike}")
        print(f"  Premium: ${result.premium}")
        print(f"  Max Profit: ${max_profit:.2f}")
        print(f"  Delta: {result.greeks.delta:.3f}")


def test_short_put_payoff(capsys):
    """Test para un short put sobre AAPL."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="short",
        option_type="put",
        underlying="AAPL",
        Strike=210.0,
        expiration=expiration,
    )

    # Verificar que es short put
    assert result.side == "short"
    assert result.option_type == "put"

    # Para short put, delta debe ser positivo (entre 0 y 1)
    assert 0 <= result.greeks.delta <= 1

    with capsys.disabled():
        print(f"\nShort Put AAPL")
        print(f"  Strike: ${result.strike}")
        print(f"  Premium: ${result.premium}")
        print(f"  Delta: {result.greeks.delta:.3f}")


def test_custom_spot_range(capsys):
    """Test con rango de precios spot personalizado."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="long",
        option_type="call",
        underlying="AAPL",
        Strike=230.0,
        expiration=expiration,
        spot_min=200.0,
        spot_max=260.0,
    )

    # Verificar que el rango es el especificado
    assert result.spot_prices[0] >= 199.0  # Tolerancia de redondeo
    assert result.spot_prices[-1] <= 261.0

    with capsys.disabled():
        print(f"\nCustom Range")
        print(f"  Rango: ${result.spot_prices[0]:.2f} - ${result.spot_prices[-1]:.2f}")


def test_invalid_strike():
    """Test que un strike invalido lance ValueError."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    with pytest.raises(ValueError, match="No existe una opci"):
        compute_option_payoff(
            side="long",
            option_type="call",
            underlying="AAPL",
            Strike=999999.0,  # Strike imposible
            expiration=expiration,
        )


def test_payoff_structure_long_call():
    """Test que verifica la estructura del payoff para long call."""
    expiration = (date.today() + timedelta(days=30)).isoformat()

    result = compute_option_payoff(
        side="long",
        option_type="call",
        underlying="AAPL",
        Strike=230.0,
        expiration=expiration,
    )

    # Para un long call:
    # - Payoff = 0 cuando spot < strike
    # - Payoff crece linealmente cuando spot > strike
    spot_prices = result.spot_prices
    payoffs = result.payoffs

    # Encontrar precios por debajo y por encima del strike
    below_strike = [p for p in payoffs if spot_prices[payoffs.index(p)] < result.strike]
    above_strike = [p for p in payoffs if spot_prices[payoffs.index(p)] > result.strike]

    if below_strike:
        # Todos los payoffs por debajo del strike deben ser 0
        assert all(p == 0 for p in below_strike)

    if len(above_strike) > 1:
        # Los payoffs por encima del strike deben ser crecientes
        assert all(above_strike[i] <= above_strike[i+1] for i in range(len(above_strike)-1))
