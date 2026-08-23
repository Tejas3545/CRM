import os
import sys

# Add backend directory to sys.path for Vercel serverless execution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
