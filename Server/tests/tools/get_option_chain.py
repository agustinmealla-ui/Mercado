import sys
from pathlib import Path
import json
from dataclasses import asdict

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from Server.core.tools.get_option_chain import get_option_chain

result = get_option_chain("AAPL", "2025-12-26")

# Convert dataclasses (recursively) to dict
data = asdict(result)

# Save as JSON
with open("option_chain.json", "w") as f:
    json.dump(data, f, indent=2, default=str)

print("Option chain saved to option_chain.json")
