// src/domain/observer/ChatSubject.ts
// Implementación concreta de ISubject para el microservicio de chat.
// Actúa como bus de eventos interno que desacopla la emisión de notificaciones
// de tiempo real de los controladores HTTP.

import { ISubject } from './ISubject';
import { IObserver } from './IObserver';
import { logger } from '../../shared/logger';

export class ChatSubject implements ISubject {
  private readonly observers: IObserver[] = [];

  /** Registra un observer; ignora duplicados. */
  subscribe(observer: IObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  /** Elimina un observer de la lista si estaba suscrito. */
  unsubscribe(observer: IObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Itera la lista de observers y llama update() en cada uno.
   * Los errores de un observer individual se capturan y logean para que
   * no interrumpan la notificación al resto.
   */
  notify(event: string, payload: unknown): void {
    for (const observer of this.observers) {
      try {
        observer.update(event, payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('ChatSubject: error in observer during notify', { event, error: message });
      }
    }
  }
}
