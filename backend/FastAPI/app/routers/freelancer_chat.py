"""
Freelancer Chat Router - Chatbot for profile structuring and optimization
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from app.services.gemini_service import get_gemini_service

router = APIRouter()

# System prompt for freelancer chatbot
FREELANCER_SYSTEM_PROMPT = """
You are a Professional Profile Coach for freelancers on a freelancing platform. Your purpose is to help freelancers create compelling, well-structured profiles that attract clients and win projects.

YOUR RESPONSIBILITIES:
- Help freelancers write professional profile headlines
- Assist in crafting compelling bio/summary sections
- Guide them in showcasing their skills effectively
- Help structure their portfolio descriptions
- Advise on presenting work experience
- Suggest how to highlight achievements and certifications
- Help write professional overview sections
- Guide on setting appropriate hourly rates
- Assist with profile completeness and optimization

PROFILE COMPONENTS YOU HELP WITH:

1. PROFESSIONAL HEADLINE
   - Concise, impactful title (e.g., "Senior Full-Stack Developer | React & Node.js Expert")
   - Should include main skill and specialization
   - Searchable keywords

2. PROFILE SUMMARY/BIO
   - Introduction that captures attention
   - Key skills and expertise
   - Years of experience
   - What makes them unique
   - Call to action

3. SKILLS SECTION
   - Primary skills (main expertise)
   - Secondary skills (complementary)
   - Tools and technologies
   - Soft skills

4. WORK EXPERIENCE
   - Relevant past projects
   - Achievements with metrics
   - Client testimonials approach

5. PORTFOLIO
   - How to describe projects
   - Highlighting impact and results
   - Showcasing best work

6. EDUCATION & CERTIFICATIONS
   - Relevant qualifications
   - Professional certifications
   - Continuous learning

7. RATE SETTING
   - Market rate guidance
   - Value-based pricing
   - Experience-based adjustments

RESPONSE GUIDELINES:
- Be encouraging and supportive
- Provide specific, actionable advice
- Help them stand out from competition
- Focus on their unique value proposition
- Use industry best practices
- Give examples when helpful

Always aim to help freelancers present their best professional selves while remaining authentic and accurate about their skills and experience.
"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class FreelancerChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None


class FreelancerChatResponse(BaseModel):
    response: str
    success: bool


@router.post("/chat", response_model=FreelancerChatResponse)
async def freelancer_chat(request: FreelancerChatRequest):
    """
    Freelancer chatbot endpoint for profile structuring
    
    This chatbot helps freelancers:
    - Create professional headlines
    - Write compelling bios and summaries
    - Structure their skills section
    - Describe portfolio projects
    - Present work experience effectively
    - Set competitive rates
    """
    gemini = get_gemini_service()

    history = None
    if request.chat_history:
        history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]

    if gemini.is_available():
        response = await gemini.chat(
            message=request.message,
            system_prompt=FREELANCER_SYSTEM_PROMPT,
            chat_history=history,
        )
    else:
        response = _freelancer_fallback(request.message, history or [])

    return FreelancerChatResponse(response=response, success=True)


def _freelancer_fallback(message: str, history: list) -> str:
    """Smart static guide when Gemini is unavailable."""
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
            "**Question 2 of 7:** What are your top skills? List them separated by commas. "
            "(e.g., *React, TypeScript, Node.js, REST API*)"
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
            "**Question 4 of 7:** What is your hourly rate in USD? "
            "(Enter a number, e.g., *45* for $45/hr)"
        )
    if turn == 4:
        return (
            "Good to know.\n\n"
            "**Question 5 of 7:** Write 2–3 sentences for your professional bio. "
            "Describe who you are, what you specialise in, and what you bring to clients."
        )
    if turn == 5:
        return (
            "Excellent bio!\n\n"
            "**Question 6 of 7:** Do you have a portfolio URL or GitHub profile? "
            "(Paste the link, or type *skip* to leave it blank)"
        )
    if turn == 6:
        return (
            "Almost done!\n\n"
            "**Question 7 of 7:** What is your availability?\n"
            "Choose one: **full-time** / **part-time** / **project-based**"
        )

    if any(w in msg for w in ["senior", "expert", "years", "experience"]):
        return (
            "With that level of experience, make sure your headline and bio reflect it clearly. "
            "Clients filter by seniority often. Fill in the form on the right and click **Complete Setup** when ready."
        )
    if any(w in msg for w in ["skip", "n/a", "none", "no"]):
        return (
            "No problem — you can always update that later in your Profile settings. "
            "Fill in any remaining fields on the right and click **Complete Setup** to continue."
        )

    return (
        "You're all set! Review your details in the form on the right, make any edits, "
        "then click **Complete Setup** to save your profile and access the platform."
    )


@router.get("/health")
async def freelancer_chat_health():
    """Check if the freelancer chatbot is available"""
    gemini = get_gemini_service()
    return {
        "service": "freelancer_chat",
        "available": gemini.is_available(),
        "purpose": "Profile structuring and optimization"
    }
