"""
Company Chat Router - Strict chatbot for job proposal creation
"""

import os
import httpx
from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List

from app.services.groq_service import get_groq_service

router = APIRouter()

LARAVEL_URL = os.getenv("LARAVEL_URL", "http://127.0.0.1:8000/api")

COMPANY_SYSTEM_PROMPT = """
You are a professional Job Proposal Assistant for companies on a freelancing platform. Your ONLY purpose is to help companies create well-structured job proposals to attract the best freelancers.

STRICT RULES:
1. You can ONLY discuss topics related to creating job proposals
2. You MUST refuse to help with anything unrelated to job proposal creation
3. If asked about anything else, politely redirect to job proposal assistance

YOUR RESPONSIBILITIES:
- Help structure job proposals with clear titles, descriptions, and requirements
- Suggest appropriate skills and qualifications to list
- Help define project scope, deliverables, and milestones
- Advise on budget ranges and payment structures
- Help write compelling project descriptions

RESPONSE GUIDELINES:
- Be professional and helpful
- Provide specific, actionable suggestions
- Use industry best practices for freelance job postings

If the user asks about ANYTHING not related to job proposals, respond with:
"I'm specifically designed to help you create effective job proposals. How can I help you with your job proposal today?"
"""

COMPANY_PROFILE_SYSTEM_PROMPT = """
You are a Company Profile Setup Assistant. Your ONLY job right now is to collect the company profile fields listed below, one question at a time.

COLLECT THESE FIELDS IN ORDER — one per message:
1. Company Name
2. Industry (e.g. Technology, Healthcare, Finance)
3. Contact First Name
4. Contact Last Name
5. Company Description (2-3 sentences about what your company does)
6. Phone Number (or "skip")

STRICT RULES:
- Ask ONLY ONE question per message — never two at once
- After every answer, echo back what you understood in bold and ask for confirmation: "Got it! So your [field] is **[value]**. Is that correct? (yes / retype)"
- NEVER move to the next question until the user confirms with yes/correct/ok
- NEVER bring up job proposals, hiring, or anything outside profile setup
- If the user says something off-topic, reply: "Let's finish setting up your profile first. [repeat current question]"
- Only after all 6 fields are confirmed, say: "Your company profile is all set! Click Complete Setup to continue."
"""


def _build_system_prompt(profile: Optional[dict], base: str = COMPANY_SYSTEM_PROMPT) -> str:
    if not profile:
        return base
    lines = [base, "\n---\nCURRENT COMPANY PROFILE (use this for personalised suggestions):"]
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


class CompanyChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None
    mode: Optional[str] = "proposal"  # "proposal" | "profile"


class CompanyChatResponse(BaseModel):
    response: str
    success: bool


class ExtractProposalRequest(BaseModel):
    chat_history: List[ChatMessage]


class ExtractProposalResponse(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    timeline: Optional[str]
    success: bool


class ContractDraftRequest(BaseModel):
    details: dict


class ContractDraftResponse(BaseModel):
    contract_text: str
    success: bool


@router.post("/chat", response_model=CompanyChatResponse)
async def company_chat(
    request: CompanyChatRequest,
    authorization: Optional[str] = Header(None),
):
    groq = get_groq_service()

    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    profile = await _fetch_profile(token) if token else None
    base_prompt = COMPANY_PROFILE_SYSTEM_PROMPT if request.mode == "profile" else COMPANY_SYSTEM_PROMPT
    system_prompt = _build_system_prompt(profile, base_prompt)

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
        response = _company_fallback(request.message, history or [])

    return CompanyChatResponse(response=response, success=True)


def _company_fallback(message: str, history: list) -> str:
    turn = len([m for m in history if m.get("role") == "assistant"])
    msg = message.lower()

    if turn == 0:
        return "Great, let's build your employer profile step by step.\n\n**Question 1 of 5:** What is your company name?"
    if turn == 1:
        return "Got it!\n\n**Question 2 of 5:** What industry does your company operate in?"
    if turn == 2:
        return "Perfect.\n\n**Question 3 of 5:** What is your name as the primary hiring contact?"
    if turn == 3:
        return "Thanks!\n\n**Question 4 of 5:** Describe your company in 2–3 sentences."
    if turn == 4:
        return "Almost there!\n\n**Question 5 of 5:** What types of freelancers do you typically hire?"

    keywords = ["react", "python", "design", "developer", "engineer", "marketing", "finance", "mobile"]
    detected = [k for k in keywords if k in msg]
    if detected:
        return f"That's useful context — hiring for **{', '.join(detected)}** roles. Fill in the form on the right."

    return "You're almost ready! Review your answers and click **Complete Setup** to save your employer profile."


@router.post("/extract-proposal", response_model=ExtractProposalResponse)
async def extract_proposal(request: ExtractProposalRequest):
    """
    Parse the chat history and extract a structured job proposal ready to post.
    """
    groq = get_groq_service()

    history_text = "\n".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in request.chat_history
    )

    system_prompt = """
You are a data extractor. Given a chat conversation about a job proposal, extract the proposal details and return ONLY valid JSON with these exact keys:
{
  "title": "string",
  "description": "string (2-4 sentences summarising the job)",
  "required_skills": ["skill1", "skill2"],
  "budget_min": number or null,
  "budget_max": number or null,
  "timeline": "string or null"
}
Rules:
- title must be concise (5-10 words)
- description should be a clear job overview
- required_skills is a flat array of strings
- budget values are numbers in USD (no symbols), null if not mentioned
- timeline is a plain string like "2 weeks" or "1 month", null if not mentioned
- Return ONLY the JSON object, no markdown, no explanation
"""
    prompt = f"Extract a structured job proposal from this conversation:\n\n{history_text}"

    raw = await groq.chat(message=prompt, system_prompt=system_prompt)

    import json, re
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group()) if match else {}
    except Exception:
        data = {}

    return ExtractProposalResponse(
        title=data.get("title", ""),
        description=data.get("description", ""),
        required_skills=data.get("required_skills", []),
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        timeline=data.get("timeline"),
        success=bool(data.get("title")),
    )


class ExtractCompanyProfileRequest(BaseModel):
    chat_history: List[ChatMessage]


class ExtractCompanyProfileResponse(BaseModel):
    contact_first_name: Optional[str]
    contact_last_name: Optional[str]
    company_name: Optional[str]
    company_description: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    company_website: Optional[str]
    success: bool


@router.post("/extract-profile", response_model=ExtractCompanyProfileResponse)
async def extract_company_profile(request: ExtractCompanyProfileRequest):
    """Parse chat history and extract structured company profile fields."""
    groq = get_groq_service()

    history_text = "\n".join(
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
        for m in request.chat_history
    )

    system_prompt = """
You are a data extractor. Given a chat conversation about a company's profile, extract the profile details and return ONLY valid JSON with these exact keys:
{
  "contact_first_name": "string or null",
  "contact_last_name": "string or null",
  "company_name": "string or null",
  "company_description": "string or null",
  "industry": "string or null",
  "company_size": "string or null",
  "company_website": "string or null"
}
Rules:
- Extract only what was explicitly mentioned
- Return ONLY the JSON object, no markdown, no explanation
"""
    prompt = f"Extract company profile fields from this conversation:\n\n{history_text}"

    raw = await groq.chat(message=prompt, system_prompt=system_prompt)

    import json, re
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group()) if match else {}
    except Exception:
        data = {}

    return ExtractCompanyProfileResponse(
        contact_first_name=data.get("contact_first_name"),
        contact_last_name=data.get("contact_last_name"),
        company_name=data.get("company_name"),
        company_description=data.get("company_description"),
        industry=data.get("industry"),
        company_size=data.get("company_size"),
        company_website=data.get("company_website"),
        success=True,
    )


@router.get("/health")
async def company_chat_health():
    groq = get_groq_service()
    return {
        "service": "company_chat",
        "available": groq.is_available(),
        "purpose": "Job proposal creation assistance",
    }


@router.post("/contract-draft", response_model=ContractDraftResponse)
async def company_contract_draft(request: ContractDraftRequest):
    groq = get_groq_service()
    details_text = "\n".join([f"- {k}: {v}" for k, v in request.details.items()])

    if groq.is_available():
        system_prompt = """
You are a Contract Drafting Assistant for freelance engagements.
Generate a clear, professional service agreement using provided details.
Always include: scope, payment terms, milestones/timeline, confidentiality, IP ownership, revisions, termination, dispute resolution, and signatures section.
Keep language practical and business-friendly.
"""
        prompt = f"Create a freelance contract draft with these details:\n{details_text}"
        contract_text = await groq.chat(prompt, system_prompt=system_prompt)
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
