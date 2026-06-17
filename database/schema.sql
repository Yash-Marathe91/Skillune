-- Skillune Database Schema (PostgreSQL for Supabase)
-- This schema is designed for an open-source, completely free platform without subscriptions.
-- It heavily utilizes Supabase features including pgvector for AI matching and Row Level Security (RLS) for data privacy.

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Links directly to Supabase auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Trigger to automatically create a user profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. RESUMES TABLE
-- Stores uploaded resumes, extracted text, and vector embeddings.
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g., "Frontend Developer Resume 2026"
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_type TEXT NOT NULL, -- pdf or docx
    extracted_text TEXT NOT NULL, -- The raw text parsed by the backend
    embedding VECTOR(384), -- Using all-MiniLM-L6-v2 which generates 384-dimensional vectors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);


-- 3. JOB DESCRIPTIONS TABLE
CREATE TABLE public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    job_url TEXT,
    embedding VECTOR(384), -- For semantic matching against the resume
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own job descriptions" ON public.job_descriptions
    FOR ALL USING (auth.uid() = user_id);


-- 4. ATS ANALYSES (The core feature)
-- Links a resume to a job description and stores the AI evaluation.
CREATE TABLE public.ats_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
    
    -- Scores (0-100)
    overall_score INTEGER NOT NULL,
    formatting_score INTEGER,
    keyword_score INTEGER,
    
    -- JSON Arrays for flexibility
    matching_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    
    -- AI generated insights
    ai_summary TEXT,
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ats_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own ATS analyses" ON public.ats_analyses
    FOR ALL USING (auth.uid() = user_id);


-- 5. SKILL GAP ROADMAPS
CREATE TABLE public.skill_gap_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.ats_analyses(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    roadmap_timeline JSONB NOT NULL, -- e.g., [{"week": 1, "topic": "Docker", "resources": [...]}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.skill_gap_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roadmaps" ON public.skill_gap_roadmaps
    FOR ALL USING (auth.uid() = user_id);


-- 6. COVER LETTERS
CREATE TABLE public.cover_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
    generated_content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their cover letters" ON public.cover_letters
    FOR ALL USING (auth.uid() = user_id);


-- 7. INTERVIEW SESSIONS
CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
    interview_type TEXT NOT NULL, -- e.g., "Behavioral", "Technical", "System Design"
    status TEXT DEFAULT 'in_progress', -- in_progress, completed
    overall_confidence_score INTEGER,
    overall_technical_score INTEGER,
    overall_communication_score INTEGER,
    feedback_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own interviews" ON public.interviews
    FOR ALL USING (auth.uid() = user_id);


-- 8. INTERVIEW QUESTIONS & RESPONSES
CREATE TABLE public.interview_exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    
    -- AI Question
    ai_question_text TEXT NOT NULL,
    expected_topics JSONB DEFAULT '[]'::jsonb,
    
    -- User Response
    user_response_text TEXT,
    user_response_audio_url TEXT, -- If using voice interview
    
    -- Evaluation
    score INTEGER,
    ai_feedback TEXT,
    fluency_metric INTEGER, -- for voice
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.interview_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own interview exchanges" ON public.interview_exchanges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i 
            WHERE i.id = interview_exchanges.interview_id AND i.user_id = auth.uid()
        )
    );


-- 9. SUPABASE STORAGE BUCKET (Resumes)
-- Run this in Supabase SQL Editor to create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Users can upload their own resumes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own resumes" ON storage.objects
    FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes" ON storage.objects
    FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
