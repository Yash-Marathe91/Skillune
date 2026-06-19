-- Create roadmaps table
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ats_analysis_id UUID REFERENCES public.ats_analyses(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    roadmap_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roadmaps
CREATE POLICY "Users can view their own roadmaps"
    ON public.roadmaps
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own roadmaps
CREATE POLICY "Users can insert their own roadmaps"
    ON public.roadmaps
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
