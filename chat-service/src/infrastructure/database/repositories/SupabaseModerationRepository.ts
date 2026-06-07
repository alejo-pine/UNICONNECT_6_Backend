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

  async estaBloqueado(userId: string): Promise<{ codigo: string; motivo: string } | null> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('moderation_history')
      .select('rejection_code, reason')
      .eq('user_id', userId)
      .gt('blocked_until', now)
      .order('blocked_until', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error verificando estado de bloqueo', { userId, error: error.message });
      return null; // Fail open to avoid blocking valid users if DB fails
    }

    if (!data) return null;

    return { codigo: data.rejection_code, motivo: data.reason };
  }

  async contarBloqueosRecientes(userId: string, since: Date): Promise<number> {
    const { count, error } = await this.supabase
      .from('moderation_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());

    if (error) {
      logger.error('Error contando bloqueos recientes', { userId, error: error.message });
      return 0;
    }

    return count ?? 0;
  }

  async getSuperAdminId(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error obteniendo ID del super admin', { error: error.message });
      return null;
    }

    return data?.id ?? null;
  }
}
