# filepath: c:\Users\clee2\Documents\letitout\backend\app\models\todo.py
from app.models.db import db
from app.utils.logger import get_logger
from datetime import datetime
import uuid

logger = get_logger(__name__)

class Todo(db.Model):
    __tablename__ = 'todos'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        due_date_str = None
        if self.due_date:
            # Always convert to UTC ISO format with Z suffix to indicate UTC timezone
            due_date_str = self.due_date.isoformat() + 'Z'
            logger.debug(f"Todo due_date: Python obj={self.due_date}, ISO={due_date_str}")
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'due_date': due_date_str,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }
