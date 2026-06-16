export interface IProfileReadRepository {
  /**
   * Obtiene el rol de un usuario dado su ID.
   * @param userId El ID del usuario.
   * @returns El rol del usuario (ej. 'student', 'super_admin') o null si no se encuentra.
   */
  getUserRole(userId: string): Promise<string | null>;

  /**
   * Obtiene la información básica del usuario (nombre y avatar).
   * @param userId El ID del usuario.
   */
  getUserBasicInfo(userId: string): Promise<{ fullName: string; avatarUrl: string } | null>;
}
