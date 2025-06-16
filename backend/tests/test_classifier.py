"""
Test script for the Gemini AI classifier
"""
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.ai_classifier import classify_input

def test_classifier():
    """Test the AI classifier with various inputs"""
    test_inputs = [
        "Remember to call mom tonight at 8pm",
        "I'm feeling really anxious about the presentation tomorrow",
        "Buy milk from the store",
        "I wonder if I made the right decision taking this job",
        "Submit the report by Friday afternoon",
        "Life has been so challenging lately, I need to find more balance"
    ]
    
    print("Testing Gemini AI Classifier...")
    print("=" * 50)
    
    for text in test_inputs:
        print(f"\nInput: {text}")
        try:
            content_type, data = classify_input(text)
            print(f"Classified as: {content_type}")
            print(f"Formatted data: {data}")
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n" + "=" * 50)
    print("Testing complete!")

if __name__ == "__main__":
    test_classifier()
