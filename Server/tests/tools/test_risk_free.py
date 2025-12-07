import pytest
from datetime import date, timedelta
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from utils.risk_free import get_risk_free_series

def test_get_risk_free_30_days(capsys):
    """Test para vencimiento en 30 días."""
    expiration = date.today() + timedelta(days=30)
    rate = get_risk_free_series(expiration)
    
    assert isinstance(rate, float)
    assert 0 <= rate <= 1  # Tasa debe estar entre 0% y 100%
    with capsys.disabled():
        print(f"\n✓ Tasa 30 días: {rate * 100:.4f}%")

def test_get_risk_free_6_months(capsys):
    """Test para vencimiento en 6 meses."""
    expiration = date.today() + timedelta(days=180)
    rate = get_risk_free_series(expiration)
    
    assert isinstance(rate, float)
    assert 0 <= rate <= 1
    with capsys.disabled():
        print(f"\n✓ Tasa 6 meses: {rate * 100:.4f}%")

def test_get_risk_free_1_year(capsys):
    """Test para vencimiento en 1 año."""
    expiration = date.today() + timedelta(days=365)
    rate = get_risk_free_series(expiration)
    
    assert isinstance(rate, float)
    assert 0 <= rate <= 1
    with capsys.disabled():
        print(f"\n✓ Tasa 1 año: {rate * 100:.4f}%")

def test_get_risk_free_5_years(capsys):
    """Test para vencimiento en 5 años."""
    expiration = date.today() + timedelta(days=365*5)
    rate = get_risk_free_series(expiration)
    
    assert isinstance(rate, float)
    assert 0 <= rate <= 1
    with capsys.disabled():
        print(f"\n✓ Tasa 5 años: {rate * 100:.4f}%")

def test_invalid_expiration_past():
    """Test que la fecha de vencimiento pasada lance ValueError."""
    past_date = date.today() - timedelta(days=10)
    
    with pytest.raises(ValueError, match="debe ser posterior a hoy"):
        get_risk_free_series(past_date)

def test_invalid_expiration_today():
    """Test que la fecha de hoy lance ValueError."""
    today = date.today()
    
    with pytest.raises(ValueError, match="debe ser posterior a hoy"):
        get_risk_free_series(today)
