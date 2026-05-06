import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StudyGroupSubject } from '../../../src/study-groups/domain/events/studyGroupSubject';
import { IObserver, StudyGroupEventType, StudyGroupEvent } from '../../../src/study-groups/domain/events/studyGroupEvents';

describe('StudyGroupSubject (Patrón Observer)', () => {
  let subject: StudyGroupSubject;
  let observer1: jest.Mocked<IObserver>;
  let observer2: jest.Mocked<IObserver>;

  beforeEach(() => {
    // Instanciamos un nuevo Subject limpio para asegurar aislamiento en los tests
    subject = new StudyGroupSubject();

    // Usamos jest.fn() para mockear el comportamiento de IObserver
    observer1 = {
      update: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };

    observer2 = {
      update: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Ciclo de notificación múltiple (Criterio 1)', () => {
    it('Debe ejecutar update() en todos los observers suscritos al notificar un evento', async () => {
      // Arrange
      subject.subscribe(observer1);
      subject.subscribe(observer2);

      const mockEvent: StudyGroupEvent = {
        type: StudyGroupEventType.MIEMBRO_ACEPTADO,
        groupId: 'group-123',
        actorUserId: 'admin-456',
        targetUserId: 'user-789',
        metadata: { action: 'test-notification' },
      };

      // Act
      await subject.notify(mockEvent);

      // Assert
      // Ambos observers deben haber sido llamados exactamente 1 vez
      expect(observer1.update).toHaveBeenCalledTimes(1);
      expect(observer2.update).toHaveBeenCalledTimes(1);

      // Ambos observers deben haber recibido el evento idéntico
      expect(observer1.update).toHaveBeenCalledWith(mockEvent);
      expect(observer2.update).toHaveBeenCalledWith(mockEvent);
    });
  });
  describe('Ciclo de desuscripción (Criterio 2)', () => {
    it('Un observer desuscrito no debe recibir eventos posteriores', async () => {
      // Arrange
      subject.subscribe(observer1);
      subject.subscribe(observer2);

      // Act 1: Se desuscribe el observer 2
      subject.unsubscribe(observer2);

      const mockEvent: StudyGroupEvent = {
        type: StudyGroupEventType.TRANSFERENCIA_ADMIN,
        groupId: 'group-123',
        actorUserId: 'admin-456',
        targetUserId: 'user-789',
      };

      // Act 2: Disparamos el evento
      await subject.notify(mockEvent);

      // Assert
      // El observer activo recibe el evento
      expect(observer1.update).toHaveBeenCalledTimes(1);
      expect(observer1.update).toHaveBeenCalledWith(mockEvent);

      // El observer desuscrito NO recibe el evento
      expect(observer2.update).not.toHaveBeenCalled();
    });
  });
  describe('Aislamiento de errores (Criterio 3)', () => {
    it('Un observer que lanza una excepción no debe detener la notificación al resto', async () => {
      // Arrange
      const errorObserver: jest.Mocked<IObserver> = {
        update: jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Fallo simulado en observer')),
      };

      subject.subscribe(errorObserver); // Suscribimos al defectuoso
      subject.subscribe(observer1);     // Suscribimos al normal

      const mockEvent: StudyGroupEvent = {
        type: StudyGroupEventType.SOLICITUD_INGRESO,
        groupId: 'group-123',
        actorUserId: 'user-000',
      };

      // Act
      // Esperamos que notify termine exitosamente sin propagar el error arrojado por errorObserver
      await expect(subject.notify(mockEvent)).resolves.not.toThrow();

      // Assert
      // El observer defectuoso intentó procesarlo
      expect(errorObserver.update).toHaveBeenCalledTimes(1);

      // El observer normal sí recibió el evento gracias al aislamiento
      expect(observer1.update).toHaveBeenCalledTimes(1);
      expect(observer1.update).toHaveBeenCalledWith(mockEvent);
    });
  });
});
