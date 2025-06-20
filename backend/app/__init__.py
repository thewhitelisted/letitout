from flask import Flask, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

from app.models.db import db
from app.utils.logger import setup_logging

def create_app():
    # Load environment variables
    load_dotenv()
    
    # Initialize Flask app
    app = Flask(__name__)
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///letitout.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 60 * 60 * 24 * 7  # 7 days
      # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
      # Set up logging
    setup_logging(app)
    
    # Remove Flask-CORS and use custom CORS handling
    # CORS(app, 
    #      origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
    #      allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    #      methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    #      supports_credentials=True)
    
    # Custom CORS handler with complete header control
    @app.after_request
    def after_request(response):
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Set CORS headers on every response
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    # Handle preflight OPTIONS requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            response = make_response()
            response.headers['Access-Control-Allow-Origin'] = frontend_url
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
      # Import blueprints here to avoid circular imports
    from app.api.thoughts import thoughts_bp
    from app.api.todos import todos_bp
    from app.api.habits import habits_bp
    from app.api.auth import auth_bp
    from app.api.content import content_bp
    from app.utils.helpers import APIError, handle_api_error
    
    # Register error handlers
    app.errorhandler(APIError)(handle_api_error)      # Register blueprints
    app.register_blueprint(thoughts_bp, url_prefix='/api/thoughts')
    app.register_blueprint(todos_bp, url_prefix='/api/todos')
    app.register_blueprint(habits_bp, url_prefix='/api/habits')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(content_bp, url_prefix='/api/content')# Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok'}
      # Root endpoint for Render health checks
    @app.route('/')
    def root():
        return {'status': 'ok', 'message': 'Let It Out API is running'}
    
    # CORS handling has been moved to the main app.py file
    # The following code has been commented out to avoid conflicts:
    # - OPTIONS request handling 
    # - CORS headers in after_request
    
    return app