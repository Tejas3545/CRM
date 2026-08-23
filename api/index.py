import os
import sys

# Add root and backend directories to sys.path for Vercel execution
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for d in [root_dir, backend_dir, current_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from app.main import app
except Exception:
    from backend.app.main import app
