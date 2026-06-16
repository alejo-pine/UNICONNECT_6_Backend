import { ISubject, IObserver, StudyGroupEvent } from './studyGroupEvents';

export class StudyGroupSubject implements ISubject {
  // Uso de Set para evitar observadores duplicados de forma nativa e iterar eficientemente
  private observers: Set<IObserver> = new Set();

  public subscribe(observer: IObserver): void {
    this.observers.add(observer);
  }

  public unsubscribe(observer: IObserver): void {
    this.observers.delete(observer);
  }

  public async notify(event: StudyGroupEvent): Promise<void> {
    // Convertir el Set a Array para ejecutar las promesas
    const notifyPromises = Array.from(this.observers).map(async (observer) => {
      try {
        await observer.update(event);
      } catch (error) {
        // Capturar errores individuales evita que un Observer fallido 
        // rompa el flujo de notificación para el resto o el caso de uso
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // En un entorno real se enviaría al logger centralizado (ej. eventLogger)
        console.error(
          `[StudyGroupSubject] Fallo al notificar observer sobre evento ${event.type}:`,
          errorMessage
        );
      }
    });

    // Promise.allSettled asegura que el flujo continúe independientemente
    // de si algunos observers fallan (status 'rejected')
    await Promise.allSettled(notifyPromises);
  }
}

// Exportamos un Singleton o instancia global por dominio si se requiere
export const studyGroupSubject = new StudyGroupSubject();
