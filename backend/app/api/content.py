"""
API routes for handling content (thoughts and todos)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.db import db
from app.models.thought import Thought
from app.models.todo import Todo
from app.models.habit import Habit, HabitInstance
from app.api.habits import generate_habit_instances
from app.utils.ai_classifier import classify_input
from app.utils.logger import get_logger
from datetime import datetime, timedelta
import pytz # Added import

logger = get_logger(__name__)

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
    # Retrieve user_timezone from the request body, defaulting to 'UTC' if not provided.
    user_timezone = data.get('timezone', 'UTC') 
    
    # Use AI to classify the content as thought or todo
    content_type, formatted_data = classify_input(text, user_timezone)
    
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
    elif content_type == 'todo':          # Parse due date if provided
        due_date = None
        if formatted_data['due_date']:
            logger.debug(f"Due date from AI classifier: {formatted_data['due_date']}")
            # Pass user_timezone to validate_and_normalize_date
            due_date = validate_and_normalize_date(formatted_data['due_date'], user_timezone)
            logger.debug(f"Normalized due date (UTC): {due_date}")
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
    
    elif content_type == 'habit':
        # Parse start date if provided
        start_date = None
        if formatted_data.get('start_date'):
            try:
                start_date = datetime.fromisoformat(formatted_data['start_date']).date()
            except ValueError:
                start_date = None
        
        # Ensure start_date is today or in the future
        today = datetime.now().date()
        if not start_date or start_date < today:
            start_date = today
        
        # Parse due time if provided
        due_time = None
        if formatted_data.get('due_time'):
            try:
                due_time = datetime.fromisoformat(f"2000-01-01T{formatted_data['due_time']}").time()
            except ValueError:
                due_time = None
          # Create a habit
        new_habit = Habit(
            user_id=user_id,
            title=formatted_data['title'],
            description=formatted_data.get('description'),
            frequency=formatted_data['frequency'],
            start_date=start_date,
            due_time=due_time
        )
        
        db.session.add(new_habit)
        db.session.commit()
        
        # Generate initial habit instances
        generate_habit_instances(new_habit)
        
        return jsonify({
            'type': 'habit',
            'data': new_habit.to_dict()
        }), 201
    
    else:
        # This shouldn't happen given our classifier logic
        return jsonify({'error': 'Failed to classify content'}), 500

@content_bp.route('', methods=['GET'])
@jwt_required()
def get_all_content():
    """Get all content (thoughts, todos, and habits) for the user"""
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
      # Get habits (active habits only)
    habits = Habit.query.filter_by(user_id=user_id, is_active=True).all()
    habit_data = [{
        'type': 'habit',
        'data': habit.to_dict()
    } for habit in habits]
    
    # Combine and sort by created_at/due_date (newest first)
    all_content = thought_data + todo_data + habit_data
    
    # Sort with a function that handles different data types
    def sort_key(item):
        data = item['data']
        if item['type'] == 'habit':
            # For habits, use due_date as the primary sort key
            return data.get('due_date', data.get('created_at', ''))
        else:
            # For thoughts and todos, use created_at
            return data.get('created_at', '')
    
    all_content.sort(key=sort_key, reverse=True)
    
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
    # Retrieve user_timezone from the request body for testing, defaulting to 'UTC'.
    user_timezone = data.get('timezone', 'UTC')
    
    # Use AI to classify the content
    # Pass user_timezone to classify_input and subsequently to validate_and_normalize_date if used directly
    content_type, formatted_data = classify_input(text, user_timezone)
    
    result = {
        'type': content_type,
        'data': formatted_data
    }
    
    # If it's a todo with a due date, add parsing info
    if content_type == 'todo' and formatted_data.get('due_date'):
        # Pass user_timezone to validate_and_normalize_date
        parsed_date = validate_and_normalize_date(formatted_data['due_date'], user_timezone)
        result['parsed_date'] = {
            'original': formatted_data['due_date'],
            'parsed': str(parsed_date) if parsed_date else None,
            'valid': parsed_date is not None
        }
    
    return jsonify(result)

def validate_and_normalize_date(date_str: str, user_timezone_str: str):
    """
    Validate and normalize a date string to a datetime object in UTC.
    Interprets naive dates as being in user_timezone_str.
    
    Args:
        date_str (str): ISO format date string (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss)
        user_timezone_str (str): IANA timezone string for the user
        
    Returns:
        datetime or None: Normalized datetime object in UTC or None if invalid
    """
    logger.debug(f"Date Validation Start - Input: '{date_str}', User Timezone: '{user_timezone_str}'")
    
    if not date_str:
        logger.debug("Empty date string, returning None")
        return None
        
    parsed_dt = None    
    try:
        # Handle Z suffix (UTC timezone marker) by converting to +00:00 format
        if isinstance(date_str, str) and date_str.endswith('Z'):
            logger.debug(f"Found 'Z' suffix, converting to +00:00 format")
            date_str = date_str[:-1] + '+00:00'
        
        # Check if we have a date with time (contains 'T' separator)
        if 'T' in date_str:
            logger.debug(f"Found 'T' separator, parsing with time component: '{date_str}'")
            parsed_dt = datetime.fromisoformat(date_str)
            logger.debug(f"Parsed with time: {parsed_dt}, Original tzinfo: {parsed_dt.tzinfo}")
        else:
            logger.debug(f"No 'T' separator, parsing as date only: '{date_str}'")
            temp_dt = datetime.fromisoformat(date_str) # Parses YYYY-MM-DD, naive
            # Set default time to noon for date-only inputs
            parsed_dt = temp_dt.replace(hour=12, minute=0, second=0, microsecond=0) # Still naive
            logger.debug(f"Initial parse (date-only), set to noon: {parsed_dt}")

        # Ensure the datetime is UTC
        if parsed_dt.tzinfo is None or parsed_dt.tzinfo.utcoffset(parsed_dt) is None:
            # Naive datetime: assume it's in the user's local timezone
            logger.debug(f"Datetime is naive. Localizing with user_timezone: '{user_timezone_str}'")
            try:
                user_tz = pytz.timezone(user_timezone_str)
            except pytz.exceptions.UnknownTimeZoneError:
                logger.warning(f"Unknown user timezone '{user_timezone_str}'. Defaulting to UTC for localization.")
                user_tz = pytz.utc
            
            localized_dt = user_tz.localize(parsed_dt)
            utc_dt = localized_dt.astimezone(pytz.utc)
            logger.debug(f"Localized to {user_timezone_str}: {localized_dt}, then converted to UTC: {utc_dt}")
        else:
            # Aware datetime: just convert to UTC
            logger.debug(f"Datetime is aware. Original tzinfo: {parsed_dt.tzinfo}. Converting to UTC.")
            utc_dt = parsed_dt.astimezone(pytz.utc)
            logger.debug(f"Converted to UTC: {utc_dt}")
        
        logger.debug(f"Normalized UTC date being returned: {utc_dt}")
        return utc_dt
        
    except ValueError as e:
        logger.debug(f"Standard ISO format parsing error: {e}")
        
        # Try MM/DD/YYYY format (fallback)
        try:
            if '/' in date_str:
                logger.debug(f"Attempting to parse fallback format MM/DD/YYYY for: '{date_str}'")
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = map(int, parts)
                    # Set default time to noon
                    alt_parsed_dt = datetime(year, month, day, 12, 0, 0) # Naive
                    logger.debug(f"Successfully parsed alternate format (naive): {alt_parsed_dt}")
                    
                    # Localize this naive datetime too
                    try:
                        user_tz = pytz.timezone(user_timezone_str)
                    except pytz.exceptions.UnknownTimeZoneError:
                        logger.warning(f"Unknown user timezone '{user_timezone_str}' for fallback. Defaulting to UTC.")
                        user_tz = pytz.utc
                    
                    localized_alt_dt = user_tz.localize(alt_parsed_dt)
                    utc_alt_dt = localized_alt_dt.astimezone(pytz.utc)
                    logger.debug(f"Localized fallback to {user_timezone_str}: {localized_alt_dt}, then to UTC: {utc_alt_dt}")
                    return utc_alt_dt
        except Exception as e2:
            logger.debug(f"Failed to parse alternate format: {e2}")
        
        logger.debug(f"All parsing attempts failed for '{date_str}'")
        return None
