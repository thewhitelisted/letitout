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
    # Use local timezone instead of UTC for more accurate date processing
    now_local = datetime.now()
    today = now_local.strftime('%Y-%m-%d')
    time = now_local.strftime('%H:%M:%S')
    
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
        "description": "[detailed description, replace lists with a summary and do not include any capital letters or null]",
        "due_date": "[any due date mentioned in ISO format, or null if none]"
    }}

    IMPORTANT RULES FOR DATES:
    - Today's date is {today}
    - Current time is {time}
    - For the due_date field, use the following format guidelines:
      - For date with time: Use format "YYYY-MM-DDThh:mm:ss" (example: "2025-06-17T15:30:00")
      - For date only: Use format "YYYY-MM-DD" (example: "2025-06-17")
    - If a specific time is mentioned (like "at 3pm", "by noon", etc.), include it in the due_date
    - If only a date is mentioned with no time, just provide the date without time    - For relative dates:
      - "tomorrow" means {(now_local + timedelta(days=1)).strftime('%Y-%m-%d')}
      - "next week" means {(now_local + timedelta(days=7)).strftime('%Y-%m-%d')}
      - "in 3 days" means {(now_local + timedelta(days=3)).strftime('%Y-%m-%d')}
    - If no date is mentioned, return null for due_date
    - Never make up dates that aren't mentioned in the input    EXAMPLES:
    - "Call John tomorrow at 3pm" → due_date: "{(now_local + timedelta(days=1)).strftime('%Y-%m-%d')}T15:00:00"
    - "Buy groceries by Friday" → due_date: "2025-06-20" (if Friday is the 20th)
    - "Remember to breathe" → due_date: null

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
        
        # Log the result for debugging
        print(f"AI classifier result: {result}")
        
        if result["type"] == "thought":
            return "thought", {
                "content": result["content"]
            }
        elif result["type"] == "todo":
            # Log the due_date specifically for debugging
            print(f"Todo due_date from AI: {result.get('due_date')}")
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
