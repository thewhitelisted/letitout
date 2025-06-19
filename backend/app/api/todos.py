from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.db import db
from app.models.todo import Todo
from app.utils.logger import get_logger
from datetime import datetime

logger = get_logger(__name__)

todos_bp = Blueprint('todos', __name__)

@todos_bp.route('', methods=['POST'])
@jwt_required()
def create_todo():
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    if 'title' not in data or not data['title'].strip():
        return jsonify({'error': 'Title is required'}), 400
      # Parse due date if provided
    due_date = None
    if 'due_date' in data and data['due_date']:
        try:
            # Parse ISO format date string and handle timezone info
            due_date_str = data['due_date'].replace('Z', '+00:00')
            due_date = datetime.fromisoformat(due_date_str)
            logger.debug(f"Parsed due_date: {due_date} from input: {data['due_date']}")
        except ValueError as e:
            logger.debug(f"Error parsing due date: {e}")
            return jsonify({'error': 'Invalid date format for due_date'}), 400
    
    # Create todo
    new_todo = Todo(
        user_id=user_id,
        title=data['title'],
        description=data.get('description'),
        due_date=due_date
    )
    
    db.session.add(new_todo)
    db.session.commit()
    
    return jsonify(new_todo.to_dict()), 201

@todos_bp.route('', methods=['GET'])
@jwt_required()
def get_todos():
    user_id = get_jwt_identity()
    
    # Get query parameters for filtering
    completed = request.args.get('completed')
    
    # Base query
    query = Todo.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if completed is not None:
        completed_bool = completed.lower() == 'true'
        query = query.filter_by(completed=completed_bool)
    
    # Custom ordering:
    # 1. Incomplete todos first
    # 2. Todos with due dates before those without
    # 3. Earlier due dates before later ones
    # 4. Most recently created first
    todos = query.order_by(
        Todo.completed,  # False (0) comes before True (1)
        Todo.due_date.is_(None),  # Not null values first
        Todo.due_date,  # Earlier dates first
        Todo.created_at.desc()  # Newest first
    ).all()
    
    return jsonify([todo.to_dict() for todo in todos])

@todos_bp.route('/<todo_id>', methods=['GET'])
@jwt_required()
def get_todo(todo_id):
    user_id = get_jwt_identity()
    
    # Get specific todo for the current user
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
        
    return jsonify(todo.to_dict())

@todos_bp.route('/<todo_id>', methods=['PUT'])
@jwt_required()
def update_todo(todo_id):
    user_id = get_jwt_identity()
    data = request.json
    
    # Find todo
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    # Update fields if provided
    if 'title' in data and data['title'].strip():
        todo.title = data['title']
        
    if 'description' in data:
        todo.description = data['description']
        
    if 'completed' in data:
        todo.completed = bool(data['completed'])
        
    if 'due_date' in data:
        if data['due_date'] is None:
            todo.due_date = None
        else:
            try:
                todo.due_date = datetime.fromisoformat(data['due_date'])
            except ValueError:
                return jsonify({'error': 'Invalid date format for due_date'}), 400
    
    db.session.commit()
    
    return jsonify(todo.to_dict())

@todos_bp.route('/<todo_id>', methods=['DELETE'])
@jwt_required()
def delete_todo(todo_id):
    user_id = get_jwt_identity()
    
    # Find todo
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()
    
    if not todo:
        return jsonify({'error': 'Todo not found'}), 404
    
    # Delete todo
    db.session.delete(todo)
    db.session.commit()
    
    return jsonify({'message': 'Todo deleted successfully'})
