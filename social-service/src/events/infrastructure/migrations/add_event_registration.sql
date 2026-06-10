-- 1. Añadir columnas para manejo de cupos y concurrencia a la tabla existente `event`
-- Se asignan valores por defecto para no romper los eventos que ya existen en la base de datos.
ALTER TABLE public.event 
ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS available_spots INT NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 2. Crear tabla intermedia `evento_usuario` para llevar el registro de inscripciones
CREATE TABLE IF NOT EXISTS public.evento_usuario (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT evento_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT evento_usuario_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event (id) ON DELETE CASCADE,
  CONSTRAINT evento_usuario_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile (id) ON DELETE CASCADE,
  -- Restricción única: un usuario solo puede registrarse una vez en el mismo evento
  CONSTRAINT evento_usuario_unique_registration UNIQUE (event_id, profile_id)
) TABLESPACE pg_default;

-- Habilitar RLS si es necesario (opcional, dependiendo de tus políticas)
ALTER TABLE public.evento_usuario ENABLE ROW LEVEL SECURITY;

-- Política básica para evento_usuario: Cualquiera puede ver los registros
CREATE POLICY "Permitir lectura a todos" ON public.evento_usuario
FOR SELECT USING (true);

-- Política para que el service_role pueda insertar/borrar (backend)
CREATE POLICY "Permitir todo al service role" ON public.evento_usuario
FOR ALL USING (auth.role() = 'service_role');


-- 3. Crear Función de Supabase (RPC) para Registro con Bloqueo Optimista
-- Esta función garantiza que la transacción sea completamente atómica y evita "race conditions"
-- si dos usuarios intentan tomar el último cupo exactamente al mismo milisegundo.

CREATE OR REPLACE FUNCTION public.register_event_optimistic(
  p_event_id UUID,
  p_profile_id UUID,
  p_expected_version INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del creador (bypass RLS local)
AS $$
DECLARE
  v_rows_affected INT;
BEGIN
  -- 1. Intentamos decrementar el cupo y aumentar la versión SOLO si la versión coincide y hay cupos
  UPDATE public.event
  SET 
    available_spots = available_spots - 1,
    version = version + 1
  WHERE 
    id = p_event_id 
    AND version = p_expected_version 
    AND available_spots > 0;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  -- 2. Si no se afectó ninguna fila, significa que se agotaron los cupos O la versión cambió 
  -- (alguien se registró una fracción de segundo antes).
  IF v_rows_affected = 0 THEN
    RETURN FALSE;
  END IF;

  -- 3. Si tuvimos éxito actualizando el evento, insertamos el registro del usuario
  -- Usamos INSERT ... ON CONFLICT por si hubo un error extraño y ya estaba registrado
  INSERT INTO public.evento_usuario (event_id, profile_id)
  VALUES (p_event_id, p_profile_id)
  ON CONFLICT (event_id, profile_id) DO NOTHING;

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    -- Si hay algún fallo a nivel de base de datos, abortamos todo.
    RETURN FALSE;
END;
$$;
