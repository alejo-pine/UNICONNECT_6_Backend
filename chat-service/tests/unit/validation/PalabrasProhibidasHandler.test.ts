import { PalabrasProhibidasHandler } from '../../../src/application/validation/PalabrasProhibidasHandler';
import { ValidationContext } from '../../../src/domain/validation/ValidationContext';
import { IModerationRepository } from '../../../src/domain/repositories/IModerationRepository';
import { MODERATION_CONFIG } from '../../../src/shared/constants';

describe('PalabrasProhibidasHandler', () => {
  let handler: PalabrasProhibidasHandler;
  let moderationRepoMock: jest.Mocked<IModerationRepository>;

  beforeEach(() => {
    // Creamos un mock completo del repositorio
    moderationRepoMock = {
      registrarBloqueo: jest.fn().mockResolvedValue(undefined),
      estaBloqueado: jest.fn(),
      contarBloqueosRecientes: jest.fn(),
      getSuperAdminId: jest.fn(),
    };

    // Inicializamos el handler usando la configuración real de constantes
    handler = new PalabrasProhibidasHandler([...MODERATION_CONFIG.DEFAULT_FORBIDDEN_WORDS], moderationRepoMock);
  });

  it('debe aprobar si el mensaje no tiene contenido', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: undefined,
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
    expect(moderationRepoMock.registrarBloqueo).not.toHaveBeenCalled();
  });

  it('debe aprobar si el mensaje es completamente inofensivo', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Hola mundo, espero que tengan un gran día.',
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
    expect(moderationRepoMock.registrarBloqueo).not.toHaveBeenCalled();
  });

  it('debe rechazar con MO_002 y registrar reporte si contiene palabra prohibida', async () => {
    // Obtenemos una palabra prohibida real de la configuración
    const palabraProhibida = MODERATION_CONFIG.DEFAULT_FORBIDDEN_WORDS[0];
    const context: ValidationContext = {
      senderId: 'user123',
      destinationType: 'dm',
      content: `Este mensaje tiene una palabra mala: ${palabraProhibida}`,
    };

    const result = await handler.manejar(context);
    
    // Assert principal requerido: Validar que el resultado es MO_002 y el motivo es correcto
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_002');
    expect(result.detalle).toBe('Mensaje contiene contenido no permitido');
    expect(result.nuevoBloqueo).toBe(true);

    // Spy: Verificar que se intentó registrar un bloqueo con duración 0 (reporte)
    expect(moderationRepoMock.registrarBloqueo).toHaveBeenCalledTimes(1);
    expect(moderationRepoMock.registrarBloqueo).toHaveBeenCalledWith(
      'user123',
      'MO_002',
      'Contenido no permitido',
      0
    );
  });
});
