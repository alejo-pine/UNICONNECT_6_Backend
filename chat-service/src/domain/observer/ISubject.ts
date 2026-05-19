// src/domain/observer/ISubject.ts
// Contrato del patrón Observer — capa de dominio.
// Un Subject mantiene una lista de observers y los notifica ante eventos relevantes.

import { IObserver } from './IObserver';

export interface ISubject {
  /**
   * Suscribe un observer para recibir notificaciones futuras.
   */
  subscribe(observer: IObserver): void;

  /**
   * Cancela la suscripción de un observer previamente registrado.
   */
  unsubscribe(observer: IObserver): void;

  /**
   * Notifica a todos los observers suscritos de un evento.
   * @param event   Nombre del evento
   * @param payload Datos del evento
   */
  notify(event: string, payload: unknown): void;
}
