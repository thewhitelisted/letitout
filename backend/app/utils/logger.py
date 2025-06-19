"""
Logging configuration for the application.
"""
import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    """
    Set up logging configuration for the Flask app.
    
    Args:
        app: Flask application instance
    """
    # Get log level from environment, default to INFO
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format='%(asctime)s %(levelname)s %(name)s: %(message)s'
    )
    
    # Set up app logger
    app.logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # In production, you might want to add file handlers
    if not app.debug and not app.testing:
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # Set up file handler with rotation
        file_handler = RotatingFileHandler(
            'logs/letitout.log', 
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.info('Let It Out application startup')

def get_logger(name):
    """
    Get a logger instance for a specific module.
    
    Args:
        name (str): Logger name (usually __name__)
        
    Returns:
        Logger: Configured logger instance
    """
    return logging.getLogger(name)
