from app.models.db import db
from datetime import datetime, timedelta
import uuid
import json

class Habit(db.Model):
    __tablename__ = 'habits'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    frequency = db.Column(db.String(20), nullable=False, default='daily')  # daily, weekly, monthly
    frequency_data = db.Column(db.Text, nullable=True)  # JSON for custom frequency settings
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)  # Optional end date
    due_time = db.Column(db.Time, nullable=True)  # Optional time for the habit
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        frequency_data = None
        if self.frequency_data:
            try:
                frequency_data = json.loads(self.frequency_data)
            except json.JSONDecodeError:
                frequency_data = None
                
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'frequency': self.frequency,
            'frequency_data': frequency_data,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'due_time': self.due_time.isoformat() if self.due_time else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

class HabitInstance(db.Model):
    __tablename__ = 'habit_instances'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    habit_id = db.Column(db.String(36), db.ForeignKey('habits.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    skipped = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    habit = db.relationship('Habit', backref='instances')
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'user_id': self.user_id,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed': self.completed,
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None,
            'skipped': self.skipped,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'habit': self.habit.to_dict() if self.habit else None
        }
