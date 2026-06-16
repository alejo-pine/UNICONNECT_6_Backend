-- Add location column to study_session table
ALTER TABLE public.study_session ADD COLUMN IF NOT EXISTS location TEXT;

-- Optional: verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'study_session';
