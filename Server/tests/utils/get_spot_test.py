import sys
from pathlib import Path

# Agregar el directorio raíz al PYTHONPATH
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from Server.utils.get_spot import get_spot_price

spot = get_spot_price("AAPL")
print(f"Precio spot de AAPL: ${spot}")
