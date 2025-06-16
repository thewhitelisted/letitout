from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

from app.models.db import db
from app.utils.cors_handler import add_cors_headers, handle_options_request

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
      # Configure CORS - more permissive for debugging
    CORS(app, origins=['*'], supports_credentials=True, allow_headers=[
        'Content-Type', 'Authorization', 'X-Requested-With',
        'Accept', 'Origin', 'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Import blueprints here to avoid circular imports
    from app.api.thoughts import thoughts_bp
    from app.api.todos import todos_bp
    from app.api.auth import auth_bp
    from app.api.content import content_bp
    from app.utils.helpers import APIError, handle_api_error
    
    # Register error handlers
    app.errorhandler(APIError)(handle_api_error)
      # Register blueprints
    app.register_blueprint(thoughts_bp, url_prefix='/api/thoughts')
    app.register_blueprint(todos_bp, url_prefix='/api/todos')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(content_bp, url_prefix='/api/content')    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok'}
    
    # Root endpoint for Render health checks
    @app.route('/')
    def root():
        return {'status': 'ok', 'message': 'Let It Out API is running'}
    
    # Handle OPTIONS requests explicitly
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_all_options(path):
        return handle_options_request()
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        return add_cors_headers(response)
        
    return app