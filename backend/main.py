from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import resume

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

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

# Trigger reload for env variables
