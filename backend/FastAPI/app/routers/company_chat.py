"""
Company Chat Router - Strict chatbot for job proposal creation
"""

from fastapi import APIRouter
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


class ContractDraftRequest(BaseModel):
    details: dict


class ContractDraftResponse(BaseModel):
    contract_text: str
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

    history = None
    if request.chat_history:
        history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]

    if gemini.is_available():
        response = await gemini.chat(
            message=request.message,
            system_prompt=COMPANY_SYSTEM_PROMPT,
            chat_history=history,
        )
    else:
        response = _company_fallback(request.message, history or [])

    return CompanyChatResponse(response=response, success=True)


def _company_fallback(message: str, history: list) -> str:
    """Smart static guide when Gemini is unavailable."""
    turn = len([m for m in history if m.get("role") == "assistant"])
    msg = message.lower()

    if turn == 0:
        return (
            "Great, let's build your employer profile step by step.\n\n"
            "**Question 1 of 5:** What is your company name?"
        )
    if turn == 1:
        return (
            f"Got it! \n\n"
            "**Question 2 of 5:** What industry does your company operate in? "
            "(e.g., Technology, Healthcare, Finance, E-Commerce)"
        )
    if turn == 2:
        return (
            "Perfect. \n\n"
            "**Question 3 of 5:** What is your name as the primary hiring contact? "
            "(First and last name)"
        )
    if turn == 3:
        return (
            "Thanks! \n\n"
            "**Question 4 of 5:** In 2–3 sentences, describe your company — "
            "what you do, your mission, and what makes working with you attractive to freelancers."
        )
    if turn == 4:
        return (
            "Almost there! \n\n"
            "**Question 5 of 5:** What types of freelancers do you typically hire, "
            "and what skills are most important to you?"
        )

    keywords = ["react", "python", "design", "developer", "engineer", "marketing", "finance", "mobile"]
    detected = [k for k in keywords if k in msg]
    if detected:
        return (
            f"That's useful context — hiring for **{', '.join(detected)}** roles. "
            "Use your answers to fill in the profile form on the right, then click **Complete Setup** to continue."
        )

    return (
        "You're almost ready! Review your answers in the form on the right and click "
        "**Complete Setup** to save your employer profile and access the platform."
    )


@router.get("/health")
async def company_chat_health():
    """Check if the company chatbot is available"""
    gemini = get_gemini_service()
    return {
        "service": "company_chat",
        "available": gemini.is_available(),
        "purpose": "Job proposal creation assistance"
    }


@router.post("/contract-draft", response_model=ContractDraftResponse)
async def company_contract_draft(request: ContractDraftRequest):
    """Generate a contract draft from employer-provided details."""
    gemini = get_gemini_service()

    details_text = "\n".join([f"- {k}: {v}" for k, v in request.details.items()])

    if gemini.is_available():
        system_prompt = """
You are a Contract Drafting Assistant for freelance engagements.
Generate a clear, professional service agreement using provided details.
Always include: scope, payment terms, milestones/timeline, confidentiality, IP ownership, revisions, termination, dispute resolution, and signatures section.
Keep language practical and business-friendly.
"""
        prompt = f"Create a freelance contract draft with these details:\n{details_text}"
        contract_text = await gemini.chat(prompt, system_prompt=system_prompt)
    else:
        scope = request.details.get("scope", "Detailed services as agreed by both parties.")
        payment = request.details.get("payment_terms", "Compensation as mutually agreed.")
        timeline = request.details.get("timeline", "Timeline to be finalized by both parties.")
        contract_text = f"""SERVICE AGREEMENT

1. Scope of Work
{scope}

2. Payment Terms
{payment}

3. Timeline
{timeline}

4. Confidentiality
Both parties agree to keep all sensitive information confidential.

5. Intellectual Property
Ownership terms will follow payment completion and mutual agreement.

6. Termination
Either party may terminate this agreement with written notice.

7. Signatures
Employer Signature: ____________________
Freelancer Signature: __________________
"""

    return ContractDraftResponse(contract_text=contract_text, success=True)
