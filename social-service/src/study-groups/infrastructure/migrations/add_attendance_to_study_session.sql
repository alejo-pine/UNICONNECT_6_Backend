-- Migration: add_attendance_to_study_session

CREATE TABLE IF NOT EXISTS public.group_study_sessions_attendances (
  session_id UUID NOT NULL REFERENCES public.study_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('attending', 'declined', 'pending')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (session_id, user_id)
);

-- Policies
ALTER TABLE public.group_study_sessions_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendances of sessions in their groups" 
ON public.group_study_sessions_attendances FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.study_session s
    JOIN public.group_member m ON m.group_id = s.group_id
    WHERE s.id = session_id AND m.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert/update their own attendance" 
ON public.group_study_sessions_attendances FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" 
ON public.group_study_sessions_attendances FOR UPDATE 
USING (auth.uid() = user_id);
