"""
API routes for handling content (thoughts and todos)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.db import db
from app.models.thought import Thought
from app.models.todo import Todo
from app.utils.ai_classifier import classify_input
from datetime import datetime, timedelta

content_bp = Blueprint('content', __name__)

@content_bp.route('', methods=['POST'])
@jwt_required()
def create_content():
    """Create new content - either a thought or todo based on AI classification"""
    user_id = get_jwt_identity()
    data = request.json
    
    if not data or 'text' not in data or not data['text'].strip():
        return jsonify({'error': 'Text content is required'}), 400
    
    text = data['text'].strip()
    
    # Use AI to classify the content as thought or todo
    content_type, formatted_data = classify_input(text)
    
    if content_type == 'thought':
        # Create a thought
        new_thought = Thought(
            user_id=user_id,
            content=formatted_data['content']
        )
        
        db.session.add(new_thought)
        db.session.commit()
        
        return jsonify({
            'type': 'thought',
            'data': new_thought.to_dict()
        }), 201
    elif content_type == 'todo':        
        # Parse due date if provided
        due_date = None
        if formatted_data['due_date']:
            due_date = validate_and_normalize_date(formatted_data['due_date'])
        
        # Create a todo
        new_todo = Todo(
            user_id=user_id,
            title=formatted_data['title'],
            description=formatted_data.get('description'),
            due_date=due_date
        )
        
        db.session.add(new_todo)
        db.session.commit()
        
        return jsonify({
            'type': 'todo',
            'data': new_todo.to_dict()
        }), 201
    
    else:
        # This shouldn't happen given our classifier logic
        return jsonify({'error': 'Failed to classify content'}), 500

@content_bp.route('', methods=['GET'])
@jwt_required()
def get_all_content():
    """Get all content (thoughts and todos) for the user"""
    user_id = get_jwt_identity()
    
    # Get thoughts
    thoughts = Thought.query.filter_by(user_id=user_id).all()
    thought_data = [{
        'type': 'thought',
        'data': thought.to_dict()
    } for thought in thoughts]
    
    # Get todos
    todos = Todo.query.filter_by(user_id=user_id).all()
    todo_data = [{
        'type': 'todo',
        'data': todo.to_dict()
    } for todo in todos]
    
    # Combine and sort by created_at (newest first)
    all_content = thought_data + todo_data
    all_content.sort(key=lambda x: x['data']['created_at'], reverse=True)
    
    return jsonify(all_content)

@content_bp.route('/thoughts', methods=['GET'])
@jwt_required()
def get_thoughts():
    """Get all thoughts for the user"""
    user_id = get_jwt_identity()
    thoughts = Thought.query.filter_by(user_id=user_id).order_by(Thought.created_at.desc()).all()
    return jsonify([thought.to_dict() for thought in thoughts])

@content_bp.route('/todos', methods=['GET'])
@jwt_required()
def get_todos():
    """Get all todos for the user"""
    user_id = get_jwt_identity()
    # Get query parameters for filtering
    completed = request.args.get('completed')
    
    # Base query
    query = Todo.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if completed is not None:
        completed_bool = completed.lower() == 'true'
        query = query.filter_by(completed=completed_bool)
    
    # Custom ordering
    todos = query.order_by(
        Todo.completed,  # False (0) comes before True (1)
        Todo.due_date.is_(None),  # Not null values first
        Todo.due_date,  # Earlier dates first
        Todo.created_at.desc()  # Newest first
    ).all()
    
    return jsonify([todo.to_dict() for todo in todos])

@content_bp.route('/test-date-parsing', methods=['POST'])
def test_date_parsing():
    """Test the date parsing capabilities"""
    data = request.json
    
    if not data or 'text' not in data:
        return jsonify({'error': 'Text is required'}), 400
    
    text = data['text']
    
    # Use AI to classify the content
    content_type, formatted_data = classify_input(text)
    
    result = {
        'type': content_type,
        'data': formatted_data
    }
    
    # If it's a todo with a due date, add parsing info
    if content_type == 'todo' and formatted_data.get('due_date'):
        parsed_date = validate_and_normalize_date(formatted_data['due_date'])
        result['parsed_date'] = {
            'original': formatted_data['due_date'],
            'parsed': str(parsed_date) if parsed_date else None,
            'valid': parsed_date is not None
        }
    
    return jsonify(result)

def validate_and_normalize_date(date_str):
    """
    Validate and normalize a date string to a datetime object.
    
    Args:
        date_str (str): ISO format date string (YYYY-MM-DD)
        
    Returns:
        datetime or None: Normalized datetime object or None if invalid
    """
    if not date_str:
        return None
        
    try:
        # Try to parse the date
        date_obj = datetime.fromisoformat(date_str)
        
        # Additional validation
        today = datetime.now().date()
        
        # Log information about the date
        print(f"Processing date: {date_str}, parsed as: {date_obj}")
        
        # Return the validated date
        return date_obj
    except ValueError as e:
        print(f"Error parsing date '{date_str}': {e}")
        
        # Try some additional date formats
        try:
            # Try MM/DD/YYYY format
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = map(int, parts)
                    date_obj = datetime(year, month, day)
                    print(f"Successfully parsed alternate format: {date_obj}")
                    return date_obj
        except Exception as e2:
            print(f"Failed to parse alternate format: {e2}")
            
        return None
