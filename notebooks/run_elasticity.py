import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.show = lambda *args, **kwargs: None

import json
import sys
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parents[1]
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

nb_path = root / "notebooks" / "03_price_elasticity.ipynb"
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

print(f"Loaded Notebook: {nb_path.name} with {len(nb['cells'])} cells.")

globals_dict = {"__name__": "__main__"}

for i, cell in enumerate(nb["cells"]):
    if cell["cell_type"] == "code":
        code = "".join(cell["source"])
        print(f"--- Running Cell {i} ---")
        try:
            exec(code, globals_dict)
        except Exception as e:
            print(f"Cell {i} failed: {e}")
            raise

print("\n--- ALL PRICE ELASTICITY NOTEBOOK CELLS EXECUTED SUCCESSFULLY ---")
