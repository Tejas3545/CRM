import os
import sys

# Ensure backend root directory is in sys.path for Vercel serverless execution
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI(title="Backend Error Handler")
    @app.get("/{full_path:path}")
    def catch_all(full_path: str):
        return {
            "status": "error",
            "message": "FastAPI backend startup error",
            "detail": str(e)
        }
