// src/domain/mensaje/IMensaje.ts
// Contrato base del patrón Decorator para mensajes del chat.
// Representa cualquier "mensaje enriquecible" (DM o Wall post) cuyo
// payload final se obtiene llamando a getPayload().

export interface IMensaje {
  /**
   * Retorna el payload listo para ser enviado por Socket.IO.
   * Los decoradores envuelven este método para enriquecer el resultado.
   */
  getPayload(): Record<string, unknown>;
}
