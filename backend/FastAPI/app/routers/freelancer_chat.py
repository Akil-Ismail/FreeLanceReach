"""
Freelancer Chat Router - Chatbot for profile structuring and optimization
"""

from fastapi import APIRouter, HTTPException
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
    
    if not gemini.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please configure GEMINI_API_KEY."
        )
    
    # Convert chat history to the expected format
    history = None
    if request.chat_history:
        history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
    
    response = await gemini.chat(
        message=request.message,
        system_prompt=FREELANCER_SYSTEM_PROMPT,
        chat_history=history
    )
    
    return FreelancerChatResponse(response=response, success=True)


@router.get("/health")
async def freelancer_chat_health():
    """Check if the freelancer chatbot is available"""
    gemini = get_gemini_service()
    return {
        "service": "freelancer_chat",
        "available": gemini.is_available(),
        "purpose": "Profile structuring and optimization"
    }
