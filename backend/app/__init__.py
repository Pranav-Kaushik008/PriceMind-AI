"""PriceMind AI Enterprise Backend Application Package."""
import sys
from pathlib import Path

# Automatically add project root and backend root to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_BACKEND_ROOT = Path(__file__).resolve().parent.parent

for _p in [str(_PROJECT_ROOT), str(_BACKEND_ROOT)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

__version__ = "1.0.0"
