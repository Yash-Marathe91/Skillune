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

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

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
        
        response = llm.invoke([SystemMessage(content=system_prompt)])
        
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
