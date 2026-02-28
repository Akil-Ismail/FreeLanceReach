"""
Company Chat Router - Strict chatbot for job proposal creation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services.gemini_service import get_gemini_service

router = APIRouter()

# Strict system prompt for company chatbot
COMPANY_SYSTEM_PROMPT = """
You are a professional Job Proposal Assistant for companies on a freelancing platform. Your ONLY purpose is to help companies create well-structured job proposals to attract the best freelancers.

STRICT RULES - YOU MUST FOLLOW THESE:
1. You can ONLY discuss topics related to creating job proposals
2. You MUST refuse to help with anything unrelated to job proposal creation
3. If asked about anything else, politely redirect to job proposal assistance

YOUR RESPONSIBILITIES:
- Help structure job proposals with clear titles, descriptions, and requirements
- Suggest appropriate skills and qualifications to list
- Help define project scope, deliverables, and milestones
- Advise on budget ranges and payment structures
- Help write compelling project descriptions
- Suggest how to make the proposal attractive to quality freelancers

JOB PROPOSAL COMPONENTS YOU HELP WITH:
1. Job Title - Clear, specific, and searchable
2. Project Description - Detailed overview of the work needed
3. Required Skills - Technical and soft skills needed
4. Scope of Work - Specific tasks and deliverables
5. Timeline - Expected duration and milestones
6. Budget - Fair compensation range
7. Experience Level - Required experience (entry/intermediate/expert)
8. Application Questions - Questions to screen freelancers

RESPONSE GUIDELINES:
- Be professional and helpful
- Provide specific, actionable suggestions
- Use industry best practices for freelance job postings
- Help the company attract the right talent

If the user asks about ANYTHING not related to job proposals, respond with:
"I'm specifically designed to help you create effective job proposals. I'd be happy to assist with crafting your job title, description, requirements, budget, or any other component of your job posting. How can I help you with your job proposal today?"
"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class CompanyChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None


class CompanyChatResponse(BaseModel):
    response: str
    success: bool


@router.post("/chat", response_model=CompanyChatResponse)
async def company_chat(request: CompanyChatRequest):
    """
    Company chatbot endpoint for job proposal assistance
    
    This chatbot strictly helps companies:
    - Create job proposal titles
    - Write project descriptions
    - Define requirements and skills
    - Set budgets and timelines
    - Structure deliverables
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
        system_prompt=COMPANY_SYSTEM_PROMPT,
        chat_history=history
    )
    
    return CompanyChatResponse(response=response, success=True)


@router.get("/health")
async def company_chat_health():
    """Check if the company chatbot is available"""
    gemini = get_gemini_service()
    return {
        "service": "company_chat",
        "available": gemini.is_available(),
        "purpose": "Job proposal creation assistance"
    }
