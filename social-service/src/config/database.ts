import { supabase } from '../utils/supabaseClient';

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('materia').select('id').limit(1);

    // Un error de Postgres (ej. tabla inexistente) significa que hay conectividad.
    // Un error de red (fetch failed) significa que no hay conexión.
    if (error && error.message.toLowerCase().includes('fetch')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
