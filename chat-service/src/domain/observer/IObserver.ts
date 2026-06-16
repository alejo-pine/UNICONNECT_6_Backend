// src/domain/observer/IObserver.ts
// Contrato del patrón Observer — capa de dominio.
// Un Observer reacciona a los eventos que le notifica un ISubject.

export interface IObserver {
  /**
   * Llamado por el ISubject cuando ocurre un evento de interés.
   * @param event  Nombre del evento (ej. 'wall:new_post')
   * @param payload Datos asociados al evento (tipado en la implementación concreta)
   */
  update(event: string, payload: unknown): void;
}
