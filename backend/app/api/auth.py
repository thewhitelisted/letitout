import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.db import db
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already in use'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=password_hash
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=new_user.id)
    
    return jsonify({
        'token': access_token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Verify password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify(user.to_dict())
