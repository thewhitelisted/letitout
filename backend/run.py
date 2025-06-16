"""
Run the Flask application
"""
import os
import sys

# Add the current directory to the path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import create_app from app.py, not from the app package
from app import create_app

# Create the application instance
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
