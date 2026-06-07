"""
Freelancer Chat Router - Chatbot for profile structuring and optimization
"""

import os
import httpx
from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List

from app.services.gemini_service import get_gemini_service

router = APIRouter()

LARAVEL_URL = os.getenv("LARAVEL_URL", "http://127.0.0.1:8000/api")

FREELANCER_SYSTEM_PROMPT = """
You are a Professional Profile Coach for freelancers on a freelancing platform. Your job is to collect all necessary profile information by asking questions one at a time, then confirm with the user before updating.

FOLLOW THIS EXACT FLOW — ask ONE question at a time, wait for the answer, then move to the next:

1. First name & last name
2. Professional headline (e.g. "Senior React Developer | 5 years exp")
3. Top skills (comma-separated list)
4. Experience level (entry / intermediate / senior / expert)
5. Hourly rate in USD
6. Professional bio (2-3 sentences)
7. Portfolio URL or GitHub (or "skip")
8. Availability (full-time / part-time / project-based)

After collecting ALL 8 answers, summarise everything clearly and ask:
"Does everything look good? Type 'yes' to update your profile or let me know what to change."

STRICT RULES — follow every single one:
- Ask only ONE question per message
- Be encouraging and give examples for each field
- Do NOT skip any field
- Do NOT show a summary until you have all 8 answers
- When the user confirms all fields, end your message with the exact tag: [PROFILE_READY]
- MANDATORY: After every user answer, you MUST echo back the clean corrected value in bold and ask for confirmation. Use EXACTLY this format: "Got it! So your [field name] is **[clean value]**. Is that correct? (yes to confirm / retype to change)"
- NEVER move to the next question until the user explicitly says yes/correct/confirm
- If the answer has a typo (e.g. "enginwwer"), correct it to the proper spelling in bold in your confirmation
- Do NOT ask the next question in the same message as the confirmation — wait for user to confirm first
"""


def _build_system_prompt(profile: Optional[dict]) -> str:
    if not profile:
        return FREELANCER_SYSTEM_PROMPT
    lines = [FREELANCER_SYSTEM_PROMPT, "\n---\nCURRENT USER PROFILE (use this context to give personalised advice):"]
    for k, v in profile.items():
        if v not in (None, "", [], {}):
            lines.append(f"- {k.replace('_', ' ').title()}: {v}")
    return "\n".join(lines)


async def _fetch_profile(token: str) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                f"{LARAVEL_URL}/chat/profile",
                headers={"Authorization": f"Bearer {token}"},
            )
            if r.status_code == 200:
                return r.json().get("profile")
    except Exception:
        pass
    return None


class ChatMessage(BaseModel):
    role: str
    content: str


class FreelancerChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None


class FreelancerChatResponse(BaseModel):
    response: str
    success: bool


@router.post("/chat", response_model=FreelancerChatResponse)
async def freelancer_chat(
    request: FreelancerChatRequest,
    authorization: Optional[str] = Header(None),
):
    groq = get_gemini_service()

    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    profile = await _fetch_profile(token) if token else None
    system_prompt = _build_system_prompt(profile)

    history = None
    if request.chat_history:
        history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]

    if groq.is_available():
        response = await groq.chat(
            message=request.message,
            system_prompt=system_prompt,
            chat_history=history,
        )
    else:
        response = _freelancer_fallback(request.message, history or [])

    return FreelancerChatResponse(response=response, success=True)


def _freelancer_fallback(message: str, history: list) -> str:
    turn = len([m for m in history if m.get("role") == "assistant"])
    msg = message.lower()

    if turn == 0:
        return (
            "I'll guide you through building a strong freelancer profile. Let's go one step at a time.\n\n"
            "**Question 1 of 7:** What is your professional headline? "
            "(e.g., *Senior React Developer*, *Freelance UI/UX Designer*, *Full-Stack Engineer*)"
        )
    if turn == 1:
        return (
            "Great headline! That will make you very searchable.\n\n"
            "**Question 2 of 7:** What are your top skills? List them separated by commas."
        )
    if turn == 2:
        return (
            "Solid skill set!\n\n"
            "**Question 3 of 7:** What is your experience level?\n"
            "Choose one: **entry** / **intermediate** / **senior** / **expert**"
        )
    if turn == 3:
        return (
            "Noted!\n\n"
            "**Question 4 of 7:** What is your hourly rate in USD?"
        )
    if turn == 4:
        return (
            "Good to know.\n\n"
            "**Question 5 of 7:** Write 2–3 sentences for your professional bio."
        )
    if turn == 5:
        return (
            "Excellent bio!\n\n"
            "**Question 6 of 7:** Do you have a portfolio URL or GitHub profile? (or type *skip*)"
        )
    if turn == 6:
        return (
            "Almost done!\n\n"
            "**Question 7 of 7:** What is your availability?\n"
            "Choose one: **full-time** / **part-time** / **project-based**"
        )

    if any(w in msg for w in ["senior", "expert", "years", "experience"]):
        return "With that level of experience, make sure your headline and bio reflect it clearly."
    if any(w in msg for w in ["skip", "n/a", "none", "no"]):
        return "No problem — you can always update that later in your Profile settings."

    return "You're all set! Review your details and click **Complete Setup** to save your profile."


class ExtractProfileRequest(BaseModel):
    chat_history: List[ChatMessage]


class ExtractProfileResponse(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    headline: Optional[str]
    skills: List[str]
    hourly_rate: Optional[float]
    experience_level: Optional[str]
    bio: Optional[str]
    portfolio_url: Optional[str]
    availability: Optional[str]
    success: bool


@router.post("/extract-profile", response_model=ExtractProfileResponse)
async def extract_profile(request: ExtractProfileRequest):
    """Parse chat history and extract structured freelancer profile fields."""
    groq = get_gemini_service()

    history_text = "\n".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in request.chat_history
    )

    system_prompt = """
You are a data extractor. Given a chat conversation about a freelancer's profile, extract the profile details and return ONLY valid JSON with these exact keys:
{
  "first_name": "string or null",
  "last_name": "string or null",
  "headline": "string or null",
  "skills": ["skill1", "skill2"],
  "hourly_rate": number or null,
  "experience_level": "entry|intermediate|senior|expert or null",
  "bio": "string or null",
  "portfolio_url": "string or null",
  "availability": "full-time|part-time|project-based or null"
}
Rules:
- Extract only what was explicitly mentioned in the conversation
- skills is a flat array of strings, empty array if none mentioned
- hourly_rate is a number (no symbols), null if not mentioned
- Return ONLY the JSON object, no markdown, no explanation
"""
    prompt = f"Extract freelancer profile fields from this conversation:\n\n{history_text}"

    raw = await groq.chat(message=prompt, system_prompt=system_prompt)

    import json, re
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group()) if match else {}
    except Exception:
        data = {}

    return ExtractProfileResponse(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        headline=data.get("headline"),
        skills=data.get("skills", []),
        hourly_rate=data.get("hourly_rate"),
        experience_level=data.get("experience_level"),
        bio=data.get("bio"),
        portfolio_url=data.get("portfolio_url"),
        availability=data.get("availability"),
        success=True,
    )


@router.get("/health")
async def freelancer_chat_health():
    groq = get_gemini_service()
    return {
        "service": "freelancer_chat",
        "available": groq.is_available(),
        "purpose": "Profile structuring and optimization",
    }
