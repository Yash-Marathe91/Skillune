from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import PydanticOutputParser

from core.config import settings
from core.auth import get_current_user, UserData
from core.db import get_auth_client

router = APIRouter()

class RoadmapRequest(BaseModel):
    target_role: str
    missing_skills: List[str]
    ats_analysis_id: str

class RoadmapTask(BaseModel):
    title: str = Field(description="Actionable title for the learning task")
    description: str = Field(description="Brief explanation of what to learn and why it matters")
    resources: List[str] = Field(description="Names of 2-3 free tools, platforms, or courses to use")
    estimated_hours: int = Field(description="Estimated hours to complete this task")

class RoadmapWeek(BaseModel):
    week_number: int = Field(description="Week number (e.g. 1, 2, 3)")
    focus: str = Field(description="The primary learning theme for this week")
    tasks: List[RoadmapTask] = Field(description="Tasks to complete this week")

class RoadmapResponse(BaseModel):
    summary: str = Field(description="A brief encouraging summary of the roadmap")
    weeks: List[RoadmapWeek] = Field(description="Week-by-week learning plan")

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )

@router.post("/generate")
async def generate_roadmap(req: RoadmapRequest, current_user: UserData = Depends(get_current_user)):
    try:
        if not req.missing_skills:
            raise HTTPException(status_code=400, detail="Missing skills array cannot be empty.")

        llm = get_llm()
        parser = PydanticOutputParser(pydantic_object=RoadmapResponse)
        
        system_prompt = (
            f"You are an expert technical career coach. The user wants to become a '{req.target_role}'.\n"
            f"An ATS scanner has identified that they are missing the following skills from their resume:\n"
            f"{', '.join(req.missing_skills)}\n\n"
            f"Create a structured, step-by-step weekly learning roadmap that focuses ONLY on teaching them these missing skills. "
            f"Distribute the skills logically across several weeks. Be highly specific with your resources and actionable tasks.\n\n"
            f"{parser.get_format_instructions()}"
        )
        
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content="Please generate my personalized skill-gap roadmap.")
        ])
        
        roadmap_data = parser.parse(response.content)
        
        # Save to database
        db = get_auth_client(current_user.token)
        result = db.table("roadmaps").insert({
            "user_id": current_user.id,
            "ats_analysis_id": req.ats_analysis_id,
            "target_role": req.target_role,
            "roadmap_data": roadmap_data.dict()
        }).execute()

        # Return the generated data along with the new ID
        return {
            "status": "success",
            "roadmap_id": result.data[0]["id"] if result.data else None,
            "roadmap": roadmap_data.dict()
        }
        
    except Exception as e:
        print(f"Roadmap Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
