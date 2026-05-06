import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Server } from 'socket.io';
import { StudyGroupSubject } from '../../../src/study-groups/domain/events/studyGroupSubject';
import { WebSocketNotificationObserver } from '../../../src/study-groups/infrastructure/observers/WebSocketNotificationObserver';
import { StudyGroupEventType, StudyGroupEvent } from '../../../src/study-groups/domain/events/studyGroupEvents';

describe('Integración: StudyGroupSubject + WebSocketNotificationObserver (Criterio 5)', () => {
  let subject: StudyGroupSubject;
  let wsObserver: WebSocketNotificationObserver;
  let mockSocketIo: jest.Mocked<Server>;
  let mockTo: jest.Mock;
  let mockEmit: jest.Mock;

  beforeEach(() => {
    // 1. Instanciamos el Subject real
    subject = new StudyGroupSubject();

    // 2. Preparamos el mock de Socket.IO 
    // Emulamos la estructura fluida: io.to('room').emit('event', payload)
    mockEmit = jest.fn();
    mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
    
    mockSocketIo = {
      to: mockTo,
    } as unknown as jest.Mocked<Server>;

    // 3. Instanciamos el observer real inyectándole la infraestructura simulada (Mock)
    wsObserver = new WebSocketNotificationObserver(mockSocketIo);

    // 4. Suscribimos el observer al subject
    subject.subscribe(wsObserver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debe emitir un evento por WebSockets correctamente cuando el Subject es notificado', async () => {
    // Arrange
    const mockEvent: StudyGroupEvent = {
      type: StudyGroupEventType.SOLICITUD_INGRESO,
      groupId: 'group-123',
      actorUserId: 'user-000',
      targetUserId: 'admin-999',
      metadata: { detail: 'peticion-mock' },
    };

    // Act
    // Activamos la notificación a nivel de Dominio
    await subject.notify(mockEvent);

    // Assert
    // El Observer real procesó el evento de dominio y se comunicó con el "Socket"

    // Verificamos que se enrutó a la sala correcta del grupo
    expect(mockSocketIo.to).toHaveBeenCalledWith('study-group:group-123');
    
    // Verificamos que se enrutó a la sala correcta del usuario objetivo
    expect(mockSocketIo.to).toHaveBeenCalledWith('user:admin-999');

    // Verificamos que se usó el evento estándar y el payload tiene la forma correcta
    expect(mockEmit).toHaveBeenCalledWith('study-group:domain-event', expect.objectContaining({
      type: StudyGroupEventType.SOLICITUD_INGRESO,
      groupId: 'group-123',
      actorUserId: 'user-000',
      data: { detail: 'peticion-mock' },
      timestamp: expect.any(String) // La fecha es autogenerada dinámicamente
    }));
  });

  it('No debe emitir a la sala personal si targetUserId es idéntico a actorUserId (evitar auto-notificaciones)', async () => {
    // Arrange
    const autoEvent: StudyGroupEvent = {
      type: StudyGroupEventType.MIEMBRO_ACEPTADO,
      groupId: 'group-123',
      actorUserId: 'user-000',
      targetUserId: 'user-000', // El mismo usuario (ej: una acción que uno mismo provoca)
    };

    // Act
    await subject.notify(autoEvent);

    // Assert
    // SÍ debe emitirse a la sala general del grupo
    expect(mockSocketIo.to).toHaveBeenCalledWith('study-group:group-123');
    
    // NO debe emitirse a la sala personal porque actor === target
    expect(mockSocketIo.to).not.toHaveBeenCalledWith('user:user-000');
  });
});
