from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

# Import database module
from app.models.db import db

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
    jwt = JWTManager(app)    # Configure CORS with specific origin only
    CORS(app, 
         origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         supports_credentials=False)
    
    # Import blueprints here to avoid circular imports
    from app.api.thoughts import thoughts_bp
    from app.api.todos import todos_bp
    from app.api.habits import habits_bp
    from app.api.auth import auth_bp
    from app.api.content import content_bp
    from app.utils.helpers import APIError, handle_api_error
      # Register error handlers
    app.errorhandler(APIError)(handle_api_error)
    
    # Register blueprints
    app.register_blueprint(thoughts_bp, url_prefix='/api/thoughts')
    app.register_blueprint(todos_bp, url_prefix='/api/todos')
    app.register_blueprint(habits_bp, url_prefix='/api/habits')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(content_bp, url_prefix='/api/content')    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok'}
        
    return app
    
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
