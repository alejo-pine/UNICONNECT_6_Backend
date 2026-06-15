-- Migración para crear la tabla de anomalías de registro (dominios no institucionales)
CREATE TABLE IF NOT EXISTS public.registration_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Puede ser nulo si el usuario no tiene ID aún
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    reason TEXT DEFAULT 'Dominio no institucional',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para búsquedas rápidas por correo
CREATE INDEX IF NOT EXISTS idx_registration_anomalies_email
ON public.registration_anomalies(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.registration_anomalies ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Solo los administradores pueden ver estas anomalías
CREATE POLICY "Super admins can view registration anomalies"
ON public.registration_anomalies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profile
    WHERE profile.id = auth.uid() AND profile.role = 'super_admin'
  )
);

-- Permitir inserciones 
CREATE POLICY "Allow inserts from anyone (n8n or backend)"
ON public.registration_anomalies
FOR INSERT
WITH CHECK (true);
