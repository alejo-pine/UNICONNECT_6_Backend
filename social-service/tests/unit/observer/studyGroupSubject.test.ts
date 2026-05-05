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
});
