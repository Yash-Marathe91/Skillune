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

class ChatVisionRequest(BaseModel):
    job_role: str
    history: List[ChatMessage]
    latest_frame_base64: str = None

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

from typing import List, Dict, Optional

class PrepRequest(BaseModel):
    job_role: str
    difficulty: str = "Mid"
    domain: Optional[str] = "General"
    language: Optional[str] = None
    frameworks: Optional[str] = None
    focus_category: Optional[str] = "Balanced"
    
class InterviewQuestion(BaseModel):
    question: str = Field(description="The interview question")
    category: str = Field(description="Category, e.g., Technical, Behavioral, Leadership")
    ideal_answer_framework: str = Field(description="A brief framework or STAR method guide on how to answer this specific question")

class PrepResult(BaseModel):
    questions: List[InterviewQuestion] = Field(description="List of 5 tailored interview questions")
    tips: List[str] = Field(description="List of 3 general tips for interviewing for this specific role")

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import PydanticOutputParser

def get_user_name(current_user: UserData) -> str:
    try:
        supabase = get_auth_client(current_user.token)
        res = supabase.table("profiles").select("full_name").eq("id", current_user.id).execute()
        if res.data and res.data[0].get("full_name"):
            return res.data[0]["full_name"]
    except Exception:
        pass
    return "Candidate"

@router.post("/start")
async def start_interview(req: StartInterviewRequest, current_user: UserData = Depends(get_current_user)):
    try:
        # We don't save to DB until the interview finishes, or we can save an initial record.
        # To keep it fast, we'll just return the opening question.
        llm = get_llm()
        
        user_name = get_user_name(current_user)
        system_prompt = (
            f"You are an expert technical interviewer. You are conducting a '{req.interview_type}' "
            f"interview for the role of '{req.job_role}'. The candidate's name is {user_name}. "
            f"Address them by their name occasionally. Introduce yourself briefly and ask the FIRST question. "
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
        
        user_name = get_user_name(current_user)
        
        # Build the message history for LangChain
        messages = [
            SystemMessage(content=(
                f"You are an expert interviewer for a {req.job_role} position. "
                f"The candidate's name is {user_name}. Address them by their name occasionally. "
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

class ChatVisionResponse(BaseModel):
    posture_feedback: str = Field(description="A brief, actionable warning or constructive feedback on the user's posture, eye contact, and body language.")
    message: str = Field(description="The conversational response and the next interview question.")

@router.post("/chat_vision")
async def chat_vision_interview(req: ChatVisionRequest, current_user: UserData = Depends(get_current_user)):
    try:
        llm = get_llm()
        user_name = get_user_name(current_user)
        parser = PydanticOutputParser(pydantic_object=ChatVisionResponse)
        
        messages = [
            SystemMessage(content=(
                f"You are an expert interviewer for a {req.job_role} position. "
                f"The candidate's name is {user_name}. Address them by their name occasionally. "
                "The user just answered your previous question AND you are given a picture of them speaking. "
                "1. Provide conversational feedback and ask the NEXT relevant interview question. "
                "2. Provide separate, actionable feedback on their body language, facial expression, and posture based on the image provided. "
                f"\n{parser.get_format_instructions()}"
            ))
        ]
        
        for i, msg in enumerate(req.history):
            if msg.role == "user":
                if i == len(req.history) - 1 and req.latest_frame_base64:
                    messages.append(HumanMessage(content=[
                        {"type": "text", "text": msg.content},
                        {"type": "image_url", "image_url": {"url": f"{req.latest_frame_base64}"}}
                    ]))
                else:
                    messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
            
        response = llm.invoke(messages)
        parsed_data = parser.parse(response.content)
        
        return {
            "status": "success", 
            "message": parsed_data.message,
            "posture_feedback": parsed_data.posture_feedback
        }
    except Exception as e:
        error_msg = str(e)
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            error_msg = "Gemini API Rate Limit Exceeded. Please wait a minute before trying again or upgrade your API key tier."
        print(f"Interview Chat Vision Error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

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

@router.post("/prep")
async def generate_prep_guide(req: PrepRequest, current_user: UserData = Depends(get_current_user)):
    try:
        llm = get_llm()
        parser = PydanticOutputParser(pydantic_object=PrepResult)
        
        system_prompt = (
            f"You are an expert technical recruiter and career coach.\n"
            f"Generate an interview preparation guide for a {req.difficulty}-level '{req.job_role}' position in the '{req.domain}' domain.\n"
        )
        
        if req.language or req.frameworks:
            system_prompt += f"The candidate's core stack includes - Language: {req.language or 'General'}, Frameworks: {req.frameworks or 'General'}.\n"
            
        system_prompt += (
            f"The focus of the interview questions should be: '{req.focus_category}'.\n"
            f"Include exactly 5 highly relevant interview questions tailored to these parameters "
            f"and provide an ideal answer framework (e.g., STAR method) for each.\n"
            f"Also include 3 general tips for succeeding in this specific interview context.\n\n"
            f"{parser.get_format_instructions()}"
        )
        
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content="Please generate the interview preparation guide.")
        ])
        
        prep_data = parser.parse(response.content)
        
        return {
            "status": "success",
            "data": prep_data.dict()
        }
    except Exception as e:
        error_msg = str(e)
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg or "quota" in error_msg.lower():
            error_msg = "Gemini API Rate Limit Exceeded. Please wait a minute before trying again or upgrade your API key tier."
        print(f"Interview Prep Error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
