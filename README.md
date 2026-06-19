# Skillune

A fully open-source, AI-powered career platform designed to help you optimize your resume, prepare for interviews, and land your dream job without expensive subscriptions.

## 🚀 Features

- **ATS Resume Analyzer**: Upload your resume and compare it against any job description. Powered by Google Gemini 2.5 Flash, it extracts missing skills and generates an ATS compatibility score.
- **AI Cover Letter Generator**: Automatically generate highly personalized cover letters tailored to your target job.
- **Mock Interview Chat**: Practice technical and behavioral interviews with an interactive AI recruiter that provides real-time feedback.
- **Secure Relational Database**: Built on top of Supabase and PostgreSQL to securely store all your documents, scores, and history.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python), LangChain, Uvicorn
- **AI Model**: Google Gemini 2.5 Flash
- **Database & Auth**: Supabase (PostgreSQL)

---

## 💻 Getting Started (Local Development)

To run the full-stack application locally, you need to run both the Frontend (Next.js) and the Backend (FastAPI) simultaneously in two separate terminals.

### 1. Start the Python Backend

Open a terminal at the root of the project and run the following commands:

```bash
# Move into the backend directory
cd backend

# Activate the virtual environment (Windows)
.\venv\Scripts\activate

# Start the FastAPI server on http://localhost:8000
uvicorn main:app --reload
```
*(Note: If you are on Mac/Linux, activate the environment using `source venv/bin/activate` instead).*

### 2. Start the Next.js Frontend

Open a **second** new terminal at the root of the project and run:

```bash
# Install dependencies (if you haven't already)
npm install

# Start the Next.js development server on http://localhost:3000
npm run dev
```

### 3. Environment Variables
Ensure you have the proper environment variables set up:
- `.env.local` in the root folder for Next.js (Supabase URL & Anon Key).
- `.env` in the `backend/` folder for FastAPI (Supabase URL, Anon Key, and `GEMINI_API_KEY`).
