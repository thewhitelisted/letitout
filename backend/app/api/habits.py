from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.db import db
from app.models.habit import Habit, HabitInstance
from app.utils.logger import get_logger
from datetime import datetime, date, timedelta
import json

logger = get_logger(__name__)

habits_bp = Blueprint('habits', __name__)

@habits_bp.route('', methods=['POST'])
@jwt_required()
def create_habit():
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    if 'title' not in data or not data['title'].strip():
        return jsonify({'error': 'Title is required'}), 400
    
    if 'frequency' not in data or data['frequency'] not in ['daily', 'weekly', 'monthly']:
        return jsonify({'error': 'Valid frequency is required (daily, weekly, monthly)'}), 400
    
    # Parse start date
    start_date = None
    if 'start_date' in data and data['start_date']:
        try:
            start_date = datetime.fromisoformat(data['start_date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid start_date format'}), 400
    else:
        start_date = date.today()
    
    # Parse end date if provided
    end_date = None
    if 'end_date' in data and data['end_date']:
        try:
            end_date = datetime.fromisoformat(data['end_date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid end_date format'}), 400
    
    # Parse due time if provided
    due_time = None
    if 'due_time' in data and data['due_time']:
        try:
            due_time = datetime.fromisoformat(f"2000-01-01T{data['due_time']}").time()
        except ValueError:
            return jsonify({'error': 'Invalid due_time format'}), 400
    
    # Parse frequency data if provided
    frequency_data = None
    if 'frequency_data' in data and data['frequency_data']:
        frequency_data = json.dumps(data['frequency_data'])
      # Create habit
    new_habit = Habit(
        user_id=user_id,
        title=data['title'],
        description=data.get('description'),
        frequency=data['frequency'],
        frequency_data=frequency_data,
        start_date=start_date,
        end_date=end_date,
        due_time=due_time
    )
    
    db.session.add(new_habit)
    db.session.commit()
    
    # Generate initial habit instances
    generate_habit_instances(new_habit)
    
    return jsonify(new_habit.to_dict()), 201

@habits_bp.route('', methods=['GET'])
@jwt_required()
def get_habits():
    user_id = get_jwt_identity()
    
    # Get query parameters for filtering
    is_active = request.args.get('is_active')
    
    # Base query
    query = Habit.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if is_active is not None:
        active_bool = is_active.lower() == 'true'
        query = query.filter_by(is_active=active_bool)
    
    habits = query.order_by(Habit.created_at.desc()).all()
    
    return jsonify([habit.to_dict() for habit in habits])

@habits_bp.route('/<habit_id>', methods=['GET'])
@jwt_required()
def get_habit(habit_id):
    user_id = get_jwt_identity()
    
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
        
    return jsonify(habit.to_dict())

@habits_bp.route('/<habit_id>', methods=['PUT'])
@jwt_required()
def update_habit(habit_id):
    user_id = get_jwt_identity()
    data = request.json
    
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    # Update fields if provided
    if 'title' in data and data['title'].strip():
        habit.title = data['title']
        
    if 'description' in data:
        habit.description = data['description']
        
    if 'is_active' in data:
        habit.is_active = bool(data['is_active'])
        
    if 'end_date' in data:
        if data['end_date'] is None:
            habit.end_date = None
        else:
            try:
                habit.end_date = datetime.fromisoformat(data['end_date']).date()
            except ValueError:
                return jsonify({'error': 'Invalid end_date format'}), 400
    
    db.session.commit()
    
    return jsonify(habit.to_dict())

@habits_bp.route('/<habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit(habit_id):
    user_id = get_jwt_identity()
    data = request.json or {}
    
    habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    delete_all_future = data.get('delete_all_future', False)
    
    if delete_all_future:
        # Delete the habit and all its instances
        HabitInstance.query.filter_by(habit_id=habit_id).delete()
        db.session.delete(habit)
    else:
        # Just mark the habit as inactive from today
        habit.is_active = False
        habit.end_date = date.today()
        # Delete future instances
        HabitInstance.query.filter(
            HabitInstance.habit_id == habit_id,
            HabitInstance.due_date > date.today()
        ).delete()
    
    db.session.commit()
    
    return jsonify({'message': 'Habit deleted successfully'})

# Habit instances endpoints
@habits_bp.route('/instances', methods=['GET'])
@jwt_required()
def get_habit_instances():
    user_id = get_jwt_identity()
    
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    completed = request.args.get('completed')
    
    # Base query
    query = HabitInstance.query.filter_by(user_id=user_id)
    
    # Apply date filters
    if start_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date).date()
            query = query.filter(HabitInstance.due_date >= start_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid start_date format'}), 400
    
    if end_date:
        try:
            end_date_obj = datetime.fromisoformat(end_date).date()
            query = query.filter(HabitInstance.due_date <= end_date_obj)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format'}), 400
    
    # Apply completion filter
    if completed is not None:
        completed_bool = completed.lower() == 'true'
        query = query.filter_by(completed=completed_bool)
    
    instances = query.order_by(HabitInstance.due_date.desc()).all()
    
    return jsonify([instance.to_dict() for instance in instances])

@habits_bp.route('/instances/<instance_id>', methods=['PUT'])
@jwt_required()
def update_habit_instance(instance_id):
    user_id = get_jwt_identity()
    data = request.json
    
    instance = HabitInstance.query.filter_by(id=instance_id, user_id=user_id).first()
    
    if not instance:
        return jsonify({'error': 'Habit instance not found'}), 404
    
    # Update completion status
    if 'completed' in data:
        instance.completed = bool(data['completed'])
        if instance.completed:
            instance.completed_at = datetime.utcnow()
            instance.skipped = False
        else:
            instance.completed_at = None
    
    # Update skipped status
    if 'skipped' in data:
        instance.skipped = bool(data['skipped'])
        if instance.skipped:
            instance.completed = False
            instance.completed_at = None
    
    db.session.commit()
    
    return jsonify(instance.to_dict())

@habits_bp.route('/instances/<instance_id>', methods=['DELETE'])
@jwt_required()
def delete_habit_instance(instance_id):
    user_id = get_jwt_identity()
    data = request.json or {}
    
    instance = HabitInstance.query.filter_by(id=instance_id, user_id=user_id).first()
    
    if not instance:
        return jsonify({'error': 'Habit instance not found'}), 404
    
    delete_all_future = data.get('delete_all_future', False)
    
    if delete_all_future:
        # Delete this instance and all future instances of the same habit
        HabitInstance.query.filter(
            HabitInstance.habit_id == instance.habit_id,
            HabitInstance.due_date >= instance.due_date
        ).delete()
        
        # Also mark the habit as inactive
        habit = Habit.query.get(instance.habit_id)
        if habit:
            habit.is_active = False
            habit.end_date = instance.due_date
    else:
        # Just delete this single instance
        db.session.delete(instance)
    
    db.session.commit()
    
    return jsonify({'message': 'Habit instance deleted successfully'})

@habits_bp.route('/regenerate', methods=['POST'])
@jwt_required()
def regenerate_habit_instances():
    """Regenerate habit instances for all active habits (useful for fixing past instances)"""
    user_id = get_jwt_identity()
    
    try:
        # Get all active habits for the user
        active_habits = Habit.query.filter_by(user_id=user_id, is_active=True).all()
        
        # Delete existing future instances (keep past completed ones)
        today = date.today()
        for habit in active_habits:
            HabitInstance.query.filter(
                HabitInstance.habit_id == habit.id,
                HabitInstance.due_date >= today
            ).delete()
        
        # Regenerate instances for each habit
        for habit in active_habits:
            generate_habit_instances(habit)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Regenerated instances for {len(active_habits)} habits',
            'habits_updated': len(active_habits)
        })
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error regenerating habit instances: {e}")
        return jsonify({'error': 'Failed to regenerate habit instances'}), 500

def generate_habit_instances(habit):
    """Generate habit instances based on frequency"""
    if not habit.is_active:
        return
    
    # Generate instances starting from today or the habit start date, whichever is later
    today = date.today()
    current_date = max(habit.start_date, today)  # Start from today or later
    end_generation_date = today + timedelta(days=30)
    
    if habit.end_date and habit.end_date < end_generation_date:
        end_generation_date = habit.end_date
    
    while current_date <= end_generation_date:
        # Check if instance already exists
        existing = HabitInstance.query.filter_by(
            habit_id=habit.id,
            due_date=current_date
        ).first()
        
        if not existing:
            instance = HabitInstance(
                habit_id=habit.id,
                user_id=habit.user_id,
                due_date=current_date
            )
            db.session.add(instance)
        
        # Move to next occurrence based on frequency
        if habit.frequency == 'daily':
            current_date += timedelta(days=1)
        elif habit.frequency == 'weekly':
            current_date += timedelta(days=7)
        elif habit.frequency == 'monthly':
            # Simple monthly increment - move to same day next month
            if current_date.month == 12:
                next_month = current_date.replace(year=current_date.year + 1, month=1)
            else:
                try:
                    next_month = current_date.replace(month=current_date.month + 1)
                except ValueError:
                    # Handle end of month edge cases
                    next_month = current_date.replace(month=current_date.month + 1, day=1)
                    next_month += timedelta(days=current_date.day - 1)
                    if next_month.day != current_date.day:
                        # If the day doesn't exist in the next month, use the last day
                        next_month = next_month.replace(day=1)
                        next_month += timedelta(days=32)
                        next_month = next_month.replace(day=1) - timedelta(days=1)
            current_date = next_month
    
    db.session.commit()
