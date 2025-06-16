from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.db import db
from app.models.thought import Thought

thoughts_bp = Blueprint('thoughts', __name__)

@thoughts_bp.route('', methods=['POST'])
@jwt_required()
def create_thought():
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    if 'content' not in data or not data['content'].strip():
        return jsonify({'error': 'Content is required'}), 400
    
    # Create thought
    new_thought = Thought(
        user_id=user_id,
        content=data['content']
    )
    
    db.session.add(new_thought)
    db.session.commit()
    
    return jsonify(new_thought.to_dict()), 201

@thoughts_bp.route('', methods=['GET'])
@jwt_required()
def get_thoughts():
    user_id = get_jwt_identity()
    
    # Get all thoughts for the current user, sorted by creation date (newest first)
    thoughts = Thought.query.filter_by(user_id=user_id).order_by(Thought.created_at.desc()).all()
    
    return jsonify([thought.to_dict() for thought in thoughts])

@thoughts_bp.route('/<thought_id>', methods=['GET'])
@jwt_required()
def get_thought(thought_id):
    user_id = get_jwt_identity()
    
    # Get specific thought for the current user
    thought = Thought.query.filter_by(id=thought_id, user_id=user_id).first()
    
    if not thought:
        return jsonify({'error': 'Thought not found'}), 404
        
    return jsonify(thought.to_dict())

@thoughts_bp.route('/<thought_id>', methods=['PUT'])
@jwt_required()
def update_thought(thought_id):
    user_id = get_jwt_identity()
    data = request.json
    
    # Find thought
    thought = Thought.query.filter_by(id=thought_id, user_id=user_id).first()
    
    if not thought:
        return jsonify({'error': 'Thought not found'}), 404
    
    # Validate required fields
    if 'content' not in data or not data['content'].strip():
        return jsonify({'error': 'Content is required'}), 400
    
    # Update thought
    thought.content = data['content']
    db.session.commit()
    
    return jsonify(thought.to_dict())

@thoughts_bp.route('/<thought_id>', methods=['DELETE'])
@jwt_required()
def delete_thought(thought_id):
    user_id = get_jwt_identity()
    
    # Find thought
    thought = Thought.query.filter_by(id=thought_id, user_id=user_id).first()
    
    if not thought:
        return jsonify({'error': 'Thought not found'}), 404
    
    # Delete thought
    db.session.delete(thought)
    db.session.commit()
    
    return jsonify({'message': 'Thought deleted successfully'})
