"""
Gemini AI Service for Chatbot Functionality
"""

import os
from pathlib import Path
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


class GeminiService:
    """Service for interacting with Google Gemini AI"""
    
    def __init__(self):
        raw_key = os.getenv("GROQ_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
        self.api_key = raw_key.strip().strip('"').strip("'")
        self.model = None
        self.last_error: Optional[str] = None

    def _looks_like_google_api_key(self) -> bool:
        return len(self.api_key) >= 20
        
    def initialize(self):
        """Initialize the Gemini model"""
        if not self.api_key:
            self.last_error = "GROQ_API_KEY is missing"
            print("[gemini] WARNING: GROQ_API_KEY not set. Chatbot features will not work.")
            return False

        if not self._looks_like_google_api_key():
            self.last_error = (
                "Invalid Gemini key format. Expected a Google API key that typically starts with 'AIza'."
            )
            print(f"[gemini] WARNING: {self.last_error}")
            return False

        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.last_error = None
            print("[gemini] Gemini AI initialized successfully.")
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"[gemini] WARNING: Failed to initialize Gemini AI: {self.last_error}")
            return False
    
    def is_available(self) -> bool:
        """Check if Gemini is properly configured"""
        if self.model is None:
            self.initialize()
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
            detail = self.last_error or "Gemini AI is not configured"
            return (
                "Error: Gemini AI is not configured correctly. "
                f"{detail}. Please set a valid GROQ_API_KEY in backend/FastAPI/.env."
            )
        
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
        _gemini_service.initialize()
    return _gemini_service
