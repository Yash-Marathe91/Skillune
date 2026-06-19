from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict

from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings
from core.auth import get_current_user, UserData
from core.db import get_auth_client

router = APIRouter()

class StartInterviewRequest(BaseModel):
    job_role: str
    interview_type: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    job_role: str
    history: List[ChatMessage]

class EvaluateRequest(BaseModel):
    job_role: str
    interview_type: str
    history: List[ChatMessage]

class EvaluationResult(BaseModel):
    overall_score: int = Field(description="Score out of 100")
    technical_score: int = Field(description="Technical accuracy score out of 100")
    communication_score: int = Field(description="Communication and clarity score out of 100")
    behavioral_score: int = Field(description="Professionalism and behavioral score out of 100")
    strengths: List[str] = Field(description="List of user's strong points during the interview")
    weaknesses: List[str] = Field(description="List of areas where the user needs improvement")
    grammatical_errors: List[str] = Field(description="List of specific grammatical errors made by the user, if any. Leave empty if none.")
    sentence_errors: List[str] = Field(description="List of specific awkward phrasing or sentence structure errors made by the user, if any. Leave empty if none.")
    feedback: str = Field(description="A comprehensive overall feedback paragraph")

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import PydanticOutputParser

@router.post("/start")
async def start_interview(req: StartInterviewRequest, current_user: UserData = Depends(get_current_user)):
    try:
        # We don't save to DB until the interview finishes, or we can save an initial record.
        # To keep it fast, we'll just return the opening question.
        llm = get_llm()
        
        system_prompt = (
            f"You are an expert technical interviewer. You are conducting a '{req.interview_type}' "
            f"interview for the role of '{req.job_role}'. Introduce yourself briefly and ask the FIRST question. "
            f"Do NOT ask multiple questions at once. Keep it conversational."
        )
        
        # Gemini requires a HumanMessage, it cannot process a SystemMessage alone
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content="Hello, I am ready for my interview. Please introduce yourself and ask the first question.")
        ]
        
        response = llm.invoke(messages)
        
        return {"status": "success", "message": response.content}
    except Exception as e:
        print(f"Interview Start Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_interview(req: ChatRequest, current_user: UserData = Depends(get_current_user)):
    try:
        llm = get_llm()
        
        # Build the message history for LangChain
        messages = [
            SystemMessage(content=(
                f"You are an expert interviewer for a {req.job_role} position. "
                "The user just answered your previous question. "
                "First, provide a brief (1-2 sentence) constructive feedback on their answer. "
                "Then, ask the NEXT relevant interview question. Do NOT ask more than one question. "
                "If the user says they don't know, provide a hint or move on to a different topic. "
                "Keep your overall response under 150 words."
            ))
        ]
        
        for msg in req.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
            
        response = llm.invoke(messages)
        
        return {"status": "success", "message": response.content}
    except Exception as e:
        print(f"Interview Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_interview(req: EvaluateRequest, current_user: UserData = Depends(get_current_user)):
    try:
        llm = get_llm()
        parser = PydanticOutputParser(pydantic_object=EvaluationResult)
        
        # Build the transcript
        transcript = ""
        for msg in req.history:
            role = "Interviewer" if msg.role == "assistant" else "Candidate"
            transcript += f"{role}: {msg.content}\n\n"
            
        system_prompt = (
            f"You are an expert technical recruiter evaluating a '{req.interview_type}' interview "
            f"for a '{req.job_role}' position.\n"
            f"Review the following interview transcript and provide a detailed evaluation.\n\n"
            f"TRANSCRIPT:\n{transcript}\n\n"
            f"{parser.get_format_instructions()}"
        )
        
        response = llm.invoke([
            SystemMessage(content=system_prompt), 
            HumanMessage(content="Please evaluate my performance.")
        ])
        eval_data = parser.parse(response.content)
        
        # --- Database Persistence ---
        try:
            db = get_auth_client(current_user.token)
            db.table("interviews").insert({
                "user_id": current_user.id,
                "job_title": req.job_role,
                "overall_score": eval_data.overall_score,
                "technical_score": eval_data.technical_score,
                "communication_score": eval_data.communication_score,
                "behavioral_score": eval_data.behavioral_score,
                "grammatical_errors": eval_data.grammatical_errors,
                "sentence_errors": eval_data.sentence_errors,
                "feedback": eval_data.feedback
            }).execute()
        except Exception as db_e:
            print(f"Failed to save interview to DB: {db_e}")
            
        return {
            "status": "success",
            "score": eval_data.overall_score,
            "technical_score": eval_data.technical_score,
            "communication_score": eval_data.communication_score,
            "behavioral_score": eval_data.behavioral_score,
            "strengths": eval_data.strengths,
            "weaknesses": eval_data.weaknesses,
            "grammatical_errors": eval_data.grammatical_errors,
            "sentence_errors": eval_data.sentence_errors,
            "feedback": eval_data.feedback
        }
    except Exception as e:
        print(f"Interview Evaluation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
