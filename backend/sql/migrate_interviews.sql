-- If you already created the table previously, run these ALTER statements instead:

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS technical_score INTEGER,
ADD COLUMN IF NOT EXISTS communication_score INTEGER,
ADD COLUMN IF NOT EXISTS behavioral_score INTEGER,
ADD COLUMN IF NOT EXISTS grammatical_errors JSONB,
ADD COLUMN IF NOT EXISTS sentence_errors JSONB;
