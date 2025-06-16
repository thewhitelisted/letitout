"""
Setup script for installing dependencies and creating directories
"""
import os
import subprocess
import sys

def setup_backend():
    """Set up the backend with all necessary directories and files"""
    print("Setting up Let It Out backend...")
    
    # Get the base directory
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Make sure we're in the backend directory
    os.chdir(base_dir)
    
    # Install dependencies
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Create .env file if it doesn't exist
    env_path = os.path.join(base_dir, ".env")
    if not os.path.exists(env_path):
        print("Creating .env file...")
        with open(env_path, "w") as f:
            f.write("DATABASE_URL=sqlite:///letitout.db\n")
            f.write("JWT_SECRET_KEY=change-this-in-production-and-keep-it-secret\n")
            f.write("FRONTEND_URL=http://localhost:3000\n")
            f.write("API_KEY=your-gemini-api-key-here\n")
    
    print("\nSetup complete! To start the application:")
    print("1. Make sure to update your .env file with the correct API keys")
    print("2. Run 'flask run' to start the development server")
    print("3. The API will be available at http://localhost:5000")

if __name__ == "__main__":
    setup_backend()
