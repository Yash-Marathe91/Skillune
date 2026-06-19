-- Create interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    technical_score INTEGER,
    communication_score INTEGER,
    behavioral_score INTEGER,
    feedback TEXT NOT NULL,
    grammatical_errors JSONB,
    sentence_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own interviews
CREATE POLICY "Users can view their own interviews"
    ON public.interviews
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own interviews
CREATE POLICY "Users can insert their own interviews"
    ON public.interviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
