import { IUniversitySubject, IUniversityObserver, UniversityEvent } from './universityEvents';

export class EventoUniversidadSubject implements IUniversitySubject {
  private observers: Set<IUniversityObserver> = new Set();

  public subscribe(observer: IUniversityObserver): void {
    this.observers.add(observer);
  }

  public unsubscribe(observer: IUniversityObserver): void {
    this.observers.delete(observer);
  }

  public async notify(event: UniversityEvent): Promise<void> {
    const notifyPromises = Array.from(this.observers).map(async (observer) => {
      try {
        await observer.update(event);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[EventoUniversidadSubject] Fallo al notificar observer sobre evento ${event.type}:`,
          errorMessage
        );
      }
    });

    await Promise.allSettled(notifyPromises);
  }
}

export const eventoUniversidadSubject = new EventoUniversidadSubject();
