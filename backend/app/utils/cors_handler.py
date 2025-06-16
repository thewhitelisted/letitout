"""
Custom CORS handler for the application
"""
from flask import make_response, request

def add_cors_headers(response):
    """Add CORS headers to all responses"""
    # Allow requests from any origin for now (for debugging)
    # In production, you would want to restrict this
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 
                        'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.add('Access-Control-Allow-Methods', 
                        'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

def handle_options_request():
    """Handle OPTIONS requests explicitly"""
    response = make_response()
    add_cors_headers(response)
    return response
