"""
AI classifier for distinguishing between thoughts and todos.
Uses Google's Gemini 2.0 Flash model for classification.
"""
import json
import os
from typing import Dict, Tuple, Union
from datetime import datetime, timedelta
import pytz  # Added import for timezone handling
from google import genai
from dotenv import load_dotenv
from app.utils.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger(__name__)

# Configure the Gemini API with the key from the environment
client=genai.Client(api_key=os.getenv("API_KEY"))

# Updated function signature to include user_timezone_str
def classify_input(text: str, user_timezone_str: str) -> Tuple[str, Dict[str, Union[str, bool, None]]]:
    try:
        user_tz = pytz.timezone(user_timezone_str)
        now_in_user_tz = datetime.now(user_tz)
    except pytz.exceptions.UnknownTimeZoneError:
        # Fallback to UTC if the timezone string is invalid and log a warning.
        logger.warning(f"Unknown timezone '{user_timezone_str}'. Defaulting to UTC.")
        user_tz = pytz.utc
        now_in_user_tz = datetime.now(user_tz)
        user_timezone_str = "UTC"  # Update user_timezone_str for the prompt

    today = now_in_user_tz.strftime('%Y-%m-%d')
    time = now_in_user_tz.strftime('%H:%M:%S')
    
    prompt = f"""
    Analyze the following text and determine if it is a thought, a todo, or a habit.

    If it's a THOUGHT, respond with a JSON object with these fields:
    {{
        "type": "thought",
        "content": "[original text in lowercase]"
    }}

    If it's a TODO, respond with a JSON object with these fields:
    {{
        "type": "todo",
        "title": "[concise title in lower case]",
        "description": "[optional detailed description in lower case, if all information is in the title, simply put null here. DO NOT ADD EXTRA INFORMATION]",
        "due_date": "[any due date mentioned in ISO format, or null if none]"
    }}    

    If it's a HABIT (recurring activity like daily exercise, weekly cleaning, etc.), respond with a JSON object with these fields:
    {{
        "type": "habit",
        "title": "[concise title in lower case]",
        "description": "[optional detailed description in lower case, if all information is in the title, simply put null here. DO NOT ADD EXTRA INFORMATION]",
        "frequency": "[daily, weekly, or monthly based on context]",        
        "start_date": "[when to start the habit in ISO format, default to {today} if not specified]",
        "due_time": "[REQUIRED IF TIME MENTIONED: time in 24-hour HH:MM format like 15:00 for 3pm, 07:00 for 7am]"
    }}
    
    FOR HABITS WITH TIME - EXAMPLES:
    "exercise at 6pm daily" → include "due_time": "18:00"
    "meditate at 7am every day" → include "due_time": "07:00" 
    "go to gym at 3 PM" → include "due_time": "15:00"
    "walk in the morning" → include "due_time": "09:00"    FOR TODOS - due_date field rules:
    - With time: "YYYY-MM-DDTHH:MM:SS" (e.g., "2025-06-17T15:30:00")  
    - Date only: "YYYY-MM-DD" (e.g., "2025-06-17")
    - No date mentioned: null
    - Today is {today}, current time is {time}
    EXAMPLES (current user's date/time is {today} {time} {user_timezone_str}):
    - "Call John tomorrow at 3pm" → due_date: "{(now_in_user_tz + timedelta(days=1)).strftime('%Y-%m-%d')}T15:00:00"
    - "Buy groceries by Friday" → due_date: "2025-06-20" (if Friday is the 20th, actual date will depend on {today})
    - "Remember to breathe" → due_date: null    Text to analyze: "{text}"
    
    CRITICAL: If this text mentions ANY time (like "3pm", "7am", "morning", "evening"), include due_time field for habits!
    
    IMPORTANT: Respond ONLY with the JSON object, nothing else.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        response_text = response.text.strip()
          # Clean up the response in case it has markdown code block formatting
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '', 1)
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        
        # Log the result for debugging
        logger.debug(f"AI classifier result: {result}")
        
        if result["type"] == "thought":
            return "thought", {
                "content": result["content"]
            }
        elif result["type"] == "todo":
            # Log the due_date specifically for debugging
            logger.debug(f"Todo due_date from AI: {result.get('due_date')}")
            return "todo", {
                "title": result["title"],
                "description": result["description"],
                "due_date": result["due_date"]
            }
        elif result["type"] == "habit":
            logger.debug(f"Habit classified: {result}")
            return "habit", {
                "title": result["title"],
                "description": result["description"],
                "frequency": result["frequency"],
                "start_date": result.get("start_date"),
                "due_time": result.get("due_time")
            }
        else:
            # Default to thought if the classification is unclear
            return "thought", {
                "content": text
            }
            
    except Exception as e:
        # If any error occurs, treat it as a thought
        logger.error(f"Error classifying input: {e}")
        return "thought", {
            "content": text
        }
