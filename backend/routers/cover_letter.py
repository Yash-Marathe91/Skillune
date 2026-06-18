from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel, Field
import fitz # PyMuPDF
import docx
import io

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from core.config import settings
from core.auth import get_current_user, UserData
from core.db import get_auth_client

router = APIRouter()

class CoverLetterResponse(BaseModel):
    company_name: str = Field(description="The name of the company hiring for the position, if mentioned. Otherwise 'Unknown Company'.")
    job_title: str = Field(description="The job title from the job description.")
    cover_letter: str = Field(description="The complete, professionally written cover letter.")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open("pdf", file_bytes)
        for page in doc:
            text += page.get_text()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")
    return text

@router.post("/generate")
async def generate_cover_letter(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: UserData = Depends(get_current_user)
):
    if not resume.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    
    file_bytes = await resume.read()
    text = ""
    
    if resume.filename.endswith('.pdf'):
        try:
            text = extract_text_from_pdf(file_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif resume.filename.endswith('.docx'):
        try:
            text = extract_text_from_docx(file_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the provided document.")

    # Initialize Gemini Chat Model
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7, # Slightly higher temperature for creative writing
        google_api_key=settings.GEMINI_API_KEY
    )

    parser = PydanticOutputParser(pydantic_object=CoverLetterResponse)

    prompt = PromptTemplate(
        template="You are an expert career coach and professional copywriter. "
                 "Write a compelling, tailored cover letter based on the applicant's Resume and the target Job Description.\n"
                 "The tone should be professional, confident, and concise. Do not invent experiences that are not in the resume.\n\n"
                 "Resume:\n{resume_text}\n\n"
                 "Job Description:\n{job_description}\n\n"
                 "{format_instructions}\n",
        input_variables=["resume_text", "job_description"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    try:
        _input = prompt.format_prompt(resume_text=text, job_description=job_description)
        response = llm.invoke(_input.to_messages())
        result = parser.parse(response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")
        
    # --- Database Persistence ---
    try:
        db = get_auth_client(current_user.token)
        
        # 1. Insert/Update Resume
        resume_data = {
            "user_id": current_user.id,
            "title": f"Resume for {result.job_title}",
            "file_path": f"local/{resume.filename}",
            "file_type": "pdf" if resume.filename.endswith('.pdf') else "docx",
            "extracted_text": text
        }
        res_res = db.table("resumes").insert(resume_data).execute()
        resume_id = res_res.data[0]['id']
        
        # 2. Insert Job Description
        job_data = {
            "user_id": current_user.id,
            "company_name": result.company_name,
            "job_title": result.job_title,
            "raw_text": job_description
        }
        job_res = db.table("job_descriptions").insert(job_data).execute()
        job_id = job_res.data[0]['id']
        
        # 3. Insert Cover Letter
        cl_data = {
            "user_id": current_user.id,
            "resume_id": resume_id,
            "job_id": job_id,
            "generated_content": result.cover_letter
        }
        db.table("cover_letters").insert(cl_data).execute()
    except Exception as e:
        print(f"Database insertion failed: {e}")
    
    return {
        "status": "success",
        "cover_letter": result.cover_letter
    }
