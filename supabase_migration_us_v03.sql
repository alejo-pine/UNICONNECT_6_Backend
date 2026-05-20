-- Criterio 3: Extrae titulo, descripcion e imagen y los almacena junto al recurso
-- Criterio 5: Permite o deniega el acceso segun el rol del usuario (columna role_required)

CREATE TABLE IF NOT EXISTS public.group_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.study_group(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  role_required TEXT DEFAULT 'member' CHECK (role_required IN ('member', 'admin')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.group_resources ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Los miembros pueden ver los recursos permitidos"
  ON public.group_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_member gm
      WHERE gm.group_id = group_resources.group_id
      AND gm.profile_id = auth.uid()
    )
    AND (
      group_resources.role_required = 'member' OR
      (group_resources.role_required = 'admin' AND EXISTS (
        SELECT 1 FROM public.study_group sg
        WHERE sg.id = group_resources.group_id AND sg.creator_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Los miembros pueden crear recursos"
  ON public.group_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_member gm
      WHERE gm.group_id = group_resources.group_id
      AND gm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Los creadores o admins pueden borrar recursos"
  ON public.group_resources
  FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_group sg
      WHERE sg.id = group_resources.group_id AND sg.creator_id = auth.uid()
    )
  );
