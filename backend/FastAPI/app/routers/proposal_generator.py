"""
AI Proposal Generator Router - Generates freelancer job applications using Groq.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from app.services.groq_service import get_groq_service

router = APIRouter()

PROPOSAL_SYSTEM_PROMPT = """
You are an expert Freelance Proposal Writer. Your job is to write compelling, professional job application proposals for freelancers.

Given a job description and a freelancer's profile details, generate a well-structured cover letter / proposal that:
1. Opens with a strong, personalised hook referencing the specific job
2. Highlights the freelancer's most relevant skills and experience for THIS job
3. Briefly describes a past project or achievement that proves they can do the work
4. Explains their approach / methodology for this type of project
5. Ends with a clear call-to-action and availability statement

FORMATTING RULES:
- Write in first person (from the freelancer's perspective)
- Keep it between 200-350 words — concise but persuasive
- Use plain paragraphs, no bullet points or headers
- Be professional, warm, and confident — not generic
- Do NOT start with "Dear Hiring Manager" or cliché openers
- Do NOT use placeholders like [Your Name] — incorporate the name if provided

If the freelancer's profile is minimal, make reasonable inferences from their skills and the job context.
"""


class FreelancerProfile(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    bio: Optional[str] = None


class ProposalGeneratorRequest(BaseModel):
    job_title: str
    job_description: str
    required_skills: Optional[List[str]] = None
    freelancer_profile: Optional[FreelancerProfile] = None


class ProposalGeneratorResponse(BaseModel):
    proposal_text: str
    success: bool
    fallback: bool = False


@router.post("/generate", response_model=ProposalGeneratorResponse)
async def generate_proposal(request: ProposalGeneratorRequest):
    """
    Generate an AI-written job application proposal for a freelancer.
    Accepts a job description + optional freelancer profile and returns
    a tailored, professional cover letter / proposal text.
    """
    groq = get_groq_service()

    profile = request.freelancer_profile or FreelancerProfile()
    skills_str = ", ".join(profile.skills or request.required_skills or [])
    required_skills_str = ", ".join(request.required_skills or [])

    profile_block = ""
    if profile.name:
        profile_block += f"Freelancer Name: {profile.name}\n"
    if profile.headline:
        profile_block += f"Professional Headline: {profile.headline}\n"
    if skills_str:
        profile_block += f"Skills: {skills_str}\n"
    if profile.experience_level:
        profile_block += f"Experience Level: {profile.experience_level}\n"
    if profile.bio:
        profile_block += f"Bio / Background: {profile.bio}\n"

    prompt = f"""Write a freelance job application proposal for the following opportunity:

JOB TITLE: {request.job_title}

JOB DESCRIPTION:
{request.job_description}

REQUIRED SKILLS: {required_skills_str or 'Not specified'}

FREELANCER PROFILE:
{profile_block.strip() or 'No profile provided — infer from job context.'}

Generate a compelling, personalised proposal (200-350 words) written from the freelancer's perspective.
"""

    if groq.is_available():
        proposal_text = await groq.chat(
            message=prompt,
            system_prompt=PROPOSAL_SYSTEM_PROMPT,
        )
        return ProposalGeneratorResponse(proposal_text=proposal_text, success=True, fallback=False)

    # Fallback template when Groq is unavailable
    name = profile.name or "I"
    headline = profile.headline or "an experienced freelancer"
    skills_display = skills_str or "the required technologies"
    fallback_text = (
        f"I am {headline} with proven expertise in {skills_display}. "
        f"After reviewing your posting for {request.job_title}, I am confident I can deliver "
        f"exactly what you need.\n\n"
        f"My background aligns closely with your requirements. I have worked on similar projects "
        f"and understand the technical and communication standards expected in this domain. "
        f"I take a structured, iterative approach: starting with a clear scope definition, "
        f"delivering incremental milestones, and maintaining transparent communication throughout.\n\n"
        f"I am available to start immediately and happy to schedule a call to discuss your project "
        f"in more detail. Looking forward to the opportunity to contribute to your team."
    )
    return ProposalGeneratorResponse(proposal_text=fallback_text, success=True, fallback=True)


@router.get("/health")
async def proposal_generator_health():
    groq = get_groq_service()
    return {
        "service": "proposal_generator",
        "available": groq.is_available(),
        "purpose": "AI-powered freelance proposal generation",
    }
