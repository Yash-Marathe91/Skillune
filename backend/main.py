from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import resume, cover_letter, interview, roadmap, profile, history

app = FastAPI(title=settings.PROJECT_NAME)

# Setup CORS to allow the Next.js frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume"])
app.include_router(cover_letter.router, prefix="/api/v1/cover-letter", tags=["Cover Letter"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Interview"])
app.include_router(roadmap.router, prefix="/api/v1/roadmap", tags=["Roadmap"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
