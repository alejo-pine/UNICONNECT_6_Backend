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
   */
  estaBloqueado(userId: string): Promise<boolean>;
}
