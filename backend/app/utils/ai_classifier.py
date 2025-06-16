"""
AI classifier for distinguishing between thoughts and todos.
Uses Google's Gemini 2.0 Flash model for classification.
"""
import json
import os
from typing import Dict, Tuple, Union
from datetime import datetime, timedelta
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API with the key from the environment
client=genai.Client(api_key=os.getenv("API_KEY"))

def classify_input(text: str) -> Tuple[str, Dict[str, Union[str, bool, None]]]:
    today = datetime.now().strftime('%Y-%m-%d')
    time = datetime.now().strftime('%H:%M:%S')
    
    prompt = f"""
    Analyze the following text and determine if it is a thought or a todo.

    If it's a THOUGHT, respond with a JSON object with these fields:
    {{
        "type": "thought",
        "content": "[original text]"
    }}

    If it's a TODO, respond with a JSON object with these fields:
    {{
        "type": "todo",
        "title": "[concise title]",
        "description": "[detailed description or null]",
        "due_date": "[any due date mentioned in ISO format (YYYY-MM-DD), or null if none]"
    }}

    IMPORTANT RULES FOR DATES:
    - Today's date is {today} (June 16, 2025)
    - Always use the current time {time} for any time-related context
    - Always use ISO format (YYYY-MM-DD) for dates
    - If a specific date is mentioned (like "tomorrow", "next Monday", "in 3 days", etc.), convert it to the actual calendar date
    - For relative dates:
      - "tomorrow" means {(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}
      - "next week" means {(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')}
      - "in 3 days" means {(datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')}
    - If no date is mentioned, return null for due_date
    - always convert to YYYY-MM-DD
    - Never make up dates that aren't mentioned in the input

    The text to analyze is: {text}
    
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
        
        if result["type"] == "thought":
            return "thought", {
                "content": result["content"]
            }
        elif result["type"] == "todo":
            return "todo", {
                "title": result["title"],
                "description": result["description"],
                "due_date": result["due_date"]
            }
        else:
            # Default to thought if the classification is unclear
            return "thought", {
                "content": text
            }
            
    except Exception as e:
        # If any error occurs, treat it as a thought
        print(f"Error classifying input: {e}")
        return "thought", {
            "content": text
        }
