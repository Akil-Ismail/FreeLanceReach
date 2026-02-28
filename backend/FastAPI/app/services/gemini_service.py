"""
Gemini AI Service for Chatbot Functionality
"""

import os
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        
    def initialize(self):
        """Initialize the Gemini model"""
        if not self.api_key:
            print("⚠️ Warning: GEMINI_API_KEY not set. Chatbot features will not work.")
            return False
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI initialized successfully!")
        return True
    
    def is_available(self) -> bool:
        """Check if Gemini is properly configured"""
        return self.model is not None
    
    async def chat(self, message: str, system_prompt: str, chat_history: Optional[list] = None) -> str:
        """
        Send a message to Gemini with a system prompt
        
        Args:
            message: The user's message
            system_prompt: The system instructions for the AI
            chat_history: Optional list of previous messages
            
        Returns:
            The AI's response
        """
        if not self.is_available():
            return "Error: Gemini AI is not configured. Please add your GEMINI_API_KEY to the .env file."
        
        try:
            # Build the full prompt with system instructions
            full_prompt = f"""
{system_prompt}

---
User Message: {message}
"""
            
            # If there's chat history, include it
            if chat_history:
                history_text = "\n".join([
                    f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                    for msg in chat_history[-10:]  # Last 10 messages for context
                ])
                full_prompt = f"""
{system_prompt}

Previous Conversation:
{history_text}

---
User Message: {message}
"""
            
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            return f"Error communicating with Gemini AI: {str(e)}"


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the Gemini service singleton"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
