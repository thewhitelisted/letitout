"""
Helper utilities for the API.
"""
from flask import jsonify

class APIError(Exception):
    """
    Custom exception class for API errors.
    
    Attributes:
        message (str): Error message
        status_code (int): HTTP status code
        payload (dict, optional): Additional data to include in the response
    """
    def __init__(self, message, status_code=400, payload=None):
        super().__init__(self)
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """Convert error to dictionary for JSON response"""
        result = dict(self.payload or ())
        result['error'] = self.message
        return result

def handle_api_error(error):
    """
    Error handler for APIError exceptions.
    
    Args:
        error (APIError): The exception raised
        
    Returns:
        Response: A JSON response with error details
    """
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response