"""
Groq AI Service for Chatbot Functionality
"""

import asyncio
import os
from pathlib import Path
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

MODEL = "llama-3.3-70b-versatile"


class GeminiService:
    """Service for interacting with Groq AI (drop-in replacement for Gemini)"""

    def __init__(self):
        raw_key = os.getenv("GROQ_API_KEY") or ""
        self.api_key = raw_key.strip().strip('"').strip("'")
        self.client: Optional[Groq] = None
        self.last_error: Optional[str] = None

    def initialize(self):
        if not self.api_key:
            self.last_error = "GROQ_API_KEY is missing"
            print("[groq] WARNING: GROQ_API_KEY not set. Chatbot features will not work.")
            return False
        try:
            self.client = Groq(api_key=self.api_key)
            self.last_error = None
            print("[groq] Groq AI initialized successfully.")
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"[groq] WARNING: Failed to initialize Groq AI: {self.last_error}")
            return False

    def is_available(self) -> bool:
        if self.client is None:
            self.initialize()
        return self.client is not None

    async def chat(self, message: str, system_prompt: str, chat_history: Optional[list] = None) -> str:
        if not self.is_available():
            detail = self.last_error or "Groq AI is not configured"
            return (
                f"Error: Groq AI is not configured correctly. "
                f"{detail}. Please set a valid GROQ_API_KEY in backend/FastAPI/.env."
            )

        try:
            messages = [{"role": "system", "content": system_prompt}]

            if chat_history:
                for msg in chat_history[-10:]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"],
                    })

            messages.append({"role": "user", "content": message})

            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=MODEL,
                messages=messages,
            )
            return response.choices[0].message.content

        except Exception as e:
            return f"Error communicating with Groq AI: {str(e)}"


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
        _gemini_service.initialize()
    return _gemini_service
