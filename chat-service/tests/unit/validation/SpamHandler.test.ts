import { SpamHandler, ContarMensajesRecientes } from '../../../src/application/validation/SpamHandler';
import { ValidationContext } from '../../../src/domain/validation/ValidationContext';
import { IModerationRepository } from '../../../src/domain/repositories/IModerationRepository';
import { MODERATION_CONFIG } from '../../../src/shared/constants';

describe('SpamHandler', () => {
  let handler: SpamHandler;
  let moderationRepoMock: jest.Mocked<IModerationRepository>;
  let countRecentMock: jest.MockedFunction<ContarMensajesRecientes>;

  beforeEach(() => {
    moderationRepoMock = {
      registrarBloqueo: jest.fn().mockResolvedValue(undefined),
      estaBloqueado: jest.fn().mockResolvedValue(null), // Por defecto no está bloqueado
      contarBloqueosRecientes: jest.fn(),
      getSuperAdminId: jest.fn(),
    };

    countRecentMock = jest.fn();

    handler = new SpamHandler(countRecentMock, moderationRepoMock);
  });

  it('debe aprobar si el usuario no supera el límite de mensajes', async () => {
    // Simular que el usuario ha enviado solo 2 mensajes en los últimos 30 segundos
    countRecentMock.mockResolvedValue(2);

    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Hola',
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
    expect(moderationRepoMock.estaBloqueado).toHaveBeenCalledWith('user1');
    expect(countRecentMock).toHaveBeenCalledTimes(1);
    expect(moderationRepoMock.registrarBloqueo).not.toHaveBeenCalled();
  });

  it('debe rechazar con MO_003 y registrar bloqueo cuando llega el 6to mensaje (límite superado)', async () => {
    // Simular que el usuario ya envió 5 mensajes (el umbral)
    countRecentMock.mockResolvedValue(MODERATION_CONFIG.SPAM_MAX_MESSAGES);

    const context: ValidationContext = {
      senderId: 'spammer',
      destinationType: 'wall',
      content: 'Sexto mensaje rápido',
    };

    const result = await handler.manejar(context);

    // Validación principal
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_003');
    expect(result.detalle).toBe('Demasiados mensajes en poco tiempo');
    expect(result.nuevoBloqueo).toBe(true);

    // Verificación de los mocks aisaldos
    expect(moderationRepoMock.registrarBloqueo).toHaveBeenCalledTimes(1);
    expect(moderationRepoMock.registrarBloqueo).toHaveBeenCalledWith(
      'spammer',
      'MO_003',
      'Spam detectado (límite de mensajes excedido)',
      MODERATION_CONFIG.SPAM_BLOCK_DURATION_SECONDS
    );
  });

  it('debe rechazar inmediatamente si el usuario ya tiene un bloqueo activo por otra infracción', async () => {
    // Simular que el usuario ya está bloqueado (ej. por malas palabras anteriores)
    moderationRepoMock.estaBloqueado.mockResolvedValue({
      codigo: 'MO_002',
      motivo: 'Contenido no permitido'
    });

    const context: ValidationContext = {
      senderId: 'blocked_user',
      destinationType: 'dm',
      content: 'Intento de mensaje',
    };

    const result = await handler.manejar(context);

    // No debe contar mensajes ni registrar un nuevo bloqueo de spam
    expect(countRecentMock).not.toHaveBeenCalled();
    expect(moderationRepoMock.registrarBloqueo).not.toHaveBeenCalled();

    // Debe retornar el código original del bloqueo activo
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_002');
    expect(result.detalle).toContain('Aún tienes un bloqueo temporal activo');
  });
});
