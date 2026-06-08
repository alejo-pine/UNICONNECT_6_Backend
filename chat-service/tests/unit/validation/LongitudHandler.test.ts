import { LongitudHandler } from '../../../src/application/validation/LongitudHandler';
import { ValidationContext } from '../../../src/domain/validation/ValidationContext';
import { MODERATION_CONFIG } from '../../../src/shared/constants';

describe('LongitudHandler', () => {
  let handler: LongitudHandler;

  beforeEach(() => {
    handler = new LongitudHandler();
  });

  it('debe aprobar si el mensaje no tiene contenido', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: undefined,
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
  });

  it('debe aprobar si el contenido está dentro del límite permitido', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'a'.repeat(MODERATION_CONFIG.MAX_MESSAGE_LENGTH),
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
  });

  it('debe rechazar con MO_001 si el contenido excede el límite permitido', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'a'.repeat(MODERATION_CONFIG.MAX_MESSAGE_LENGTH + 1),
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_001');
    expect(result.detalle).toBe('Mensaje demasiado largo');
  });
});
