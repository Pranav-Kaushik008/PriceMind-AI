r"""
notebooks/run_shap.py
---------------------
Builds and executes the Module 7 SHAP explainability notebook.
Run from the project root: backend\venv\Scripts\python.exe notebooks/run_shap.py
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def run(cmd: list, cwd=None):
    print(f"\n$ {' '.join(str(c) for c in cmd)}")
    result = subprocess.run(cmd, cwd=cwd or ROOT, capture_output=False)
    if result.returncode != 0:
        print(f"[ERROR] Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)

python = sys.executable

# Step 1: Build the notebook
run([python, "notebooks/build_shap_notebook.py"])

# Step 2: Execute with nbconvert
nb_path = ROOT / "notebooks" / "07_shap_explainability.ipynb"
run([
    python, "-m", "jupyter", "nbconvert",
    "--to", "notebook",
    "--execute",
    "--inplace",
    "--ExecutePreprocessor.timeout=300",
    "--ExecutePreprocessor.kernel_name=python3",
    str(nb_path),
])

print("\n✓ Module 7 notebook executed successfully.")
print(f"  → {nb_path}")
