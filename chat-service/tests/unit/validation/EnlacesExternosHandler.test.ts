import { EnlacesExternosHandler } from '../../../src/application/validation/EnlacesExternosHandler';
import { ValidationContext } from '../../../src/domain/validation/ValidationContext';

describe('EnlacesExternosHandler', () => {
  let handler: EnlacesExternosHandler;

  beforeEach(() => {
    handler = new EnlacesExternosHandler();
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

  it('debe aprobar si el texto no contiene URLs', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Hola, ¿cómo estás hoy?',
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(true);
  });

  it('debe rechazar con MO_004 si detecta un enlace externo http', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Mira esto http://ejemplo.com',
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_004');
  });

  it('debe rechazar con MO_004 si detecta un enlace externo https', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Visita https://google.com para más info',
    };

    const result = await handler.manejar(context);
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('MO_004');
  });
});
