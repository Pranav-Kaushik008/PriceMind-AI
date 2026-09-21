import sys
import os
from pathlib import Path

# Add backend and root to sys.path for test discovery
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for path in (str(backend_dir), str(root_dir)):
    if path not in sys.path:
        sys.path.insert(0, path)
