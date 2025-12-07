import sys
from pathlib import Path

# Agregar el directorio raíz al PYTHONPATH
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir))

from Server.core.tools.get_expiration import get_option_expiration

x = get_option_expiration("AAPL")
print(x)