"""
Initialize the database and run the application
"""
import os
import sys
from dotenv import load_dotenv

# Add the current directory to the path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import necessary modules
from flask import Flask
from flask_migrate import Migrate
from app.models.db import db
from app.models.user import User
from app.models.thought import Thought
from app.models.todo import Todo

def init_db():
    """Initialize the database with tables"""
    # Load environment variables
    load_dotenv()
    
    # Create a minimal app for database initialization
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///letitout.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    migrate = Migrate(app, db)
    
    with app.app_context():
        # Create tables
        db.create_all()
        print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
