import { SupabaseClient } from '@supabase/supabase-js';
import { IModerationRepository } from '../../../domain/repositories/IModerationRepository';
import { logger } from '../../../shared/logger';

export class SupabaseModerationRepository implements IModerationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async registrarBloqueo(
    userId: string,
    codigo: string,
    motivo: string,
    duracionSegundos: number
  ): Promise<void> {
    const blockedUntil = new Date(Date.now() + duracionSegundos * 1000);

    const { error } = await this.supabase
      .from('moderation_history')
      .insert({
        user_id: userId,
        rejection_code: codigo,
        reason: motivo,
        blocked_until: blockedUntil.toISOString(),
      });

    if (error) {
      logger.error('Error registrando historial de moderación', { userId, error: error.message });
      // Log the error but don't crash the request just because logging the moderation action failed
    }
  }

  async estaBloqueado(userId: string): Promise<boolean> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('moderation_history')
      .select('id')
      .eq('user_id', userId)
      .gt('blocked_until', now)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error verificando estado de bloqueo', { userId, error: error.message });
      return false; // Fail open to avoid blocking valid users if DB fails
    }

    return data !== null;
  }
}
