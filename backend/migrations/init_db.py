from flask import Flask
from flask_migrate import Migrate, MigrateCommand
from app import create_app
from app.models.db import db
from app.models import User, Thought, Todo

# Initialize app
app = create_app()

# Create tables
with app.app_context():
    db.create_all()
    print("Database tables created successfully")
