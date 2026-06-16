-- Migración para crear la tabla de feedback de chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    normalized_question TEXT NOT NULL,
    response TEXT NOT NULL,
    rating BOOLEAN NOT NULL, -- TRUE para "Útil", FALSE para "No útil"
    comments TEXT,
    references JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para búsquedas de agregación rápida
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_normalized_question
ON public.chatbot_feedback(normalized_question);

CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_rating
ON public.chatbot_feedback(rating);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chatbot_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Todos los usuarios pueden ver sus propios feedbacks
CREATE POLICY "Users can view their own feedback"
ON public.chatbot_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Los administradores (super_admin) pueden ver todos
CREATE POLICY "Super admins can view all feedback"
ON public.chatbot_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.id = auth.uid() AND profile.role = 'super_admin'
  )
);

-- Los usuarios autenticados pueden insertar feedback
CREATE POLICY "Authenticated users can insert feedback"
ON public.chatbot_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);
