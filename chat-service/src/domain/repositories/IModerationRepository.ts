// src/domain/repositories/IModerationRepository.ts

export interface IModerationRepository {
  /**
   * Registra un evento de bloqueo para un usuario.
   * @param userId El ID del usuario.
   * @param codigo El código de rechazo (ej. MO_003).
   * @param motivo El motivo textual del bloqueo.
   * @param duracionSegundos La duración del bloqueo en segundos.
   */
  registrarBloqueo(userId: string, codigo: string, motivo: string, duracionSegundos: number): Promise<void>;

  /**
   * Verifica si el usuario tiene un bloqueo activo en este momento.
   * @param userId El ID del usuario a verificar.
   * @returns El código y motivo del bloqueo si existe, o null.
   */
  estaBloqueado(userId: string): Promise<{ codigo: string; motivo: string } | null>;

  /**
   * Cuenta cuántos bloqueos ha recibido un usuario desde una fecha específica.
   * @param userId El ID del usuario.
   * @param since La fecha desde la cual contar.
   */
  contarBloqueosRecientes(userId: string, since: Date): Promise<number>;

  /**
   * Obtiene los IDs de todos los usuarios con rol de super_admin.
   * Útil para notificaciones de escalamiento de moderación.
   */
  getSuperAdminsIds(): Promise<string[]>;
}
