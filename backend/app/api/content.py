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
            print(f"Due date from AI classifier: {formatted_data['due_date']}")
            due_date = validate_and_normalize_date(formatted_data['due_date'])
            print(f"Normalized due date: {due_date}")
        
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
    Always stores dates in UTC timezone in the database.
    
    Args:
        date_str (str): ISO format date string (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss)
        
    Returns:
        datetime or None: Normalized datetime object in UTC or None if invalid
    """
    print(f"\n=== Date Validation Start ===")
    print(f"Input date string: '{date_str}', Type: {type(date_str)}")
    
    if not date_str:
        print("Empty date string, returning None")
        return None
        
    date_obj = None    
    try:
        # Handle Z suffix (UTC timezone marker) by converting to +00:00 format
        # which is compatible with fromisoformat
        if isinstance(date_str, str) and date_str.endswith('Z'):
            print(f"Found 'Z' suffix (UTC timezone), converting to +00:00 format")
            date_str = date_str.replace('Z', '+00:00')
        
        # Check if we have a date with time (contains 'T' separator)
        if 'T' in date_str:
            print(f"Found 'T' separator in date string, parsing with time component")
            # Parse the ISO format with time
            date_obj = datetime.fromisoformat(date_str)
            print(f"Parsed with time: {date_obj}, hour={date_obj.hour}, minute={date_obj.minute}")
        else:
            print(f"No 'T' separator found, parsing as date only and adding default time")
            # Parse just the date and set default time to noon (12:00)
            date_obj = datetime.fromisoformat(date_str)
            print(f"Initial parse: {date_obj}")
            date_obj = date_obj.replace(hour=12, minute=0, second=0)
            print(f"After adding default time: {date_obj}")
            print(f"Final datetime object: {date_obj}, UTC timestamp: {date_obj.timestamp()}")
        print(f"=== Date Validation End ===\n")
        
        # Return the validated date
        print(f"Normalized date being returned: {date_obj} (UTC timestamp: {date_obj.timestamp()})")
        return date_obj
    except ValueError as e:
        print(f"Standard ISO format parsing error: {e}")
        
        # Try some additional date formats
        try:
            # Try MM/DD/YYYY format
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = map(int, parts)
                    # Set default time to noon
                    date_obj = datetime(year, month, day, 12, 0, 0)
                    print(f"Successfully parsed alternate format: {date_obj}")
                    print(f"=== Date Validation End ===\n")
                    return date_obj
        except Exception as e2:
            print(f"Failed to parse alternate format: {e2}")
        
        print(f"All parsing attempts failed for '{date_str}'")
        print(f"=== Date Validation End ===\n")
        return None
