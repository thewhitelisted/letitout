import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.db import db
from app.models.user import User
from app.models.habit import Habit, HabitInstance

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

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ['current_password', 'new_password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify current password
    if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Hash new password
    new_password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update password
    user.password_hash = new_password_hash
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'})

@auth_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
      # Count thoughts
    thought_count = len(user.thoughts)
    
    # Count todos and completed todos
    todo_count = len(user.todos)
    completed_todo_count = sum(1 for todo in user.todos if todo.completed)
    
    # Count habits and habit completion stats
    active_habits = Habit.query.filter_by(user_id=user_id, is_active=True).all()
    habit_count = len(active_habits)
      # Get habit instances from the last 30 days
    from datetime import date, timedelta
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    recent_instances = HabitInstance.query.filter(
        HabitInstance.user_id == user_id,
        HabitInstance.due_date >= thirty_days_ago,
        HabitInstance.due_date <= today
    ).all()
    
    total_instances = len(recent_instances)
    completed_instances = sum(1 for instance in recent_instances if instance.completed)
    
    return jsonify({
        'thoughts_count': thought_count,
        'todos_count': todo_count,
        'completed_todos_count': completed_todo_count,
        'completion_rate': round(completed_todo_count / todo_count * 100, 1) if todo_count > 0 else 0,
        'habits_count': habit_count,
        'habit_instances_total': total_instances,
        'habit_instances_completed': completed_instances,
        'habit_completion_rate': round(completed_instances / total_instances * 100, 1) if total_instances > 0 else 0
    })
