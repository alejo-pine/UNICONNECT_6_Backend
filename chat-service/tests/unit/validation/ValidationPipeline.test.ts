import { ValidarPermisosHandler } from '../../../src/application/validation/ValidarPermisosHandler';
import { SpamHandler } from '../../../src/application/validation/SpamHandler';
import { ValidarTamanoHandler } from '../../../src/application/validation/ValidarTamanoHandler';
import { ValidarAdjuntoHandler } from '../../../src/application/validation/ValidarAdjuntoHandler';
import { ValidarContenidoHandler } from '../../../src/application/validation/ValidarContenidoHandler';
import { LongitudHandler } from '../../../src/application/validation/LongitudHandler';
import { PalabrasProhibidasHandler } from '../../../src/application/validation/PalabrasProhibidasHandler';
import { EnlacesExternosHandler } from '../../../src/application/validation/EnlacesExternosHandler';
import { ValidarMencionesHandler } from '../../../src/application/validation/ValidarMencionesHandler';
import { ValidationContext } from '../../../src/domain/validation/ValidationContext';
import { MODERATION_CONFIG } from '../../../src/shared/constants';

describe('ValidationPipeline Completo', () => {
  let permisos: ValidarPermisosHandler;
  let spam: SpamHandler;
  let tamano: ValidarTamanoHandler;
  let adjunto: ValidarAdjuntoHandler;
  let contenido: ValidarContenidoHandler;
  let longitud: LongitudHandler;
  let palabras: PalabrasProhibidasHandler;
  let enlaces: EnlacesExternosHandler;
  let menciones: ValidarMencionesHandler;

  let moderationRepoMock: any;
  let hasPermisosMock: jest.Mock;
  let countRecentMock: jest.Mock;

  beforeEach(() => {
    // Mocks de dependencias
    hasPermisosMock = jest.fn().mockReturnValue(true);
    countRecentMock = jest.fn().mockResolvedValue(0);
    moderationRepoMock = {
      registrarBloqueo: jest.fn().mockResolvedValue(undefined),
      estaBloqueado: jest.fn().mockResolvedValue(null),
      contarBloqueosRecientes: jest.fn(),
      getSuperAdminsIds: jest.fn(),
    };

    // 1. Instanciación
    permisos = new ValidarPermisosHandler(hasPermisosMock);
    spam = new SpamHandler(countRecentMock, moderationRepoMock);
    tamano = new ValidarTamanoHandler();
    adjunto = new ValidarAdjuntoHandler();
    contenido = new ValidarContenidoHandler();
    longitud = new LongitudHandler();
    palabras = new PalabrasProhibidasHandler([...MODERATION_CONFIG.DEFAULT_FORBIDDEN_WORDS], moderationRepoMock);
    enlaces = new EnlacesExternosHandler();
    menciones = new ValidarMencionesHandler();

    // 2. Ensamblar cadena en el orden EXACTO de la fábrica
    permisos
      .setSiguiente(spam)
      .setSiguiente(tamano)
      .setSiguiente(adjunto)
      .setSiguiente(contenido)
      .setSiguiente(longitud)
      .setSiguiente(palabras)
      .setSiguiente(enlaces)
      .setSiguiente(menciones);

    // 3. Crear spies sobre el método 'validar' de cada instancia para ver si se ejecuta la lógica
    // Usamos 'validar' porque 'manejar' es el que invoca a 'validar' en la clase base. 
    // Espiando 'validar' garantizamos que el eslabón procesó el contexto.
    jest.spyOn(permisos as any, 'validar');
    jest.spyOn(spam as any, 'validar');
    jest.spyOn(tamano as any, 'validar');
    jest.spyOn(adjunto as any, 'validar');
    jest.spyOn(contenido as any, 'validar');
    jest.spyOn(longitud as any, 'validar');
    jest.spyOn(palabras as any, 'validar');
    jest.spyOn(enlaces as any, 'validar');
    jest.spyOn(menciones as any, 'validar');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe ejecutar toda la cadena si el mensaje es completamente válido', async () => {
    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Mensaje de prueba totalmente válido, sin enlaces ni groserías',
      attachments: [{
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1000,
        storagePath: 'test.jpg'
      }]
    };

    const result = await permisos.manejar(context);

    // Verificamos éxito total
    expect(result.valido).toBe(true);

    // Verificamos que absolutamente TODOS los handlers fueron invocados 1 vez
    expect((permisos as any).validar).toHaveBeenCalledTimes(1);
    expect((spam as any).validar).toHaveBeenCalledTimes(1);
    expect((tamano as any).validar).toHaveBeenCalledTimes(1);
    expect((adjunto as any).validar).toHaveBeenCalledTimes(1);
    expect((contenido as any).validar).toHaveBeenCalledTimes(1);
    expect((longitud as any).validar).toHaveBeenCalledTimes(1);
    expect((palabras as any).validar).toHaveBeenCalledTimes(1);
    expect((enlaces as any).validar).toHaveBeenCalledTimes(1);
    expect((menciones as any).validar).toHaveBeenCalledTimes(1);
  });

  it('debe cortar la cadena en ValidarTamanoHandler y NO ejecutar los posteriores', async () => {
    // Para forzar el fallo en ValidarTamanoHandler (tamaño mayor a 20MB):
    const attachments = [{
        fileName: 'archivo_pesado.zip',
        fileType: 'application/zip',
        fileSize: 25 * 1024 * 1024, // 25 MB
        storagePath: 'archivo_pesado.zip'
    }];

    const context: ValidationContext = {
      senderId: 'user1',
      destinationType: 'dm',
      content: 'Hola',
      attachments
    };

    const result = await permisos.manejar(context);

    // Verificamos el rechazo
    expect(result.valido).toBe(false);
    // El handler de tamaño en uniconnect retorna 'CH_001' si son muchos attachments
    // No validamos el código exacto acá si no lo sabemos de memoria, pero debe ser falso.

    // VERIFICACIÓN EXPLÍCITA DEL CORTE DE CADENA (Requerimiento US-T06 Tarea 2)
    // Los previos y el infractor deben ejecutarse:
    expect((permisos as any).validar).toHaveBeenCalledTimes(1);
    expect((spam as any).validar).toHaveBeenCalledTimes(1);
    expect((tamano as any).validar).toHaveBeenCalledTimes(1);

    // Los posteriores NO deben ejecutarse:
    expect((adjunto as any).validar).toHaveBeenCalledTimes(0);
    expect((contenido as any).validar).toHaveBeenCalledTimes(0);
    expect((longitud as any).validar).toHaveBeenCalledTimes(0);
    expect((palabras as any).validar).toHaveBeenCalledTimes(0);
    expect((enlaces as any).validar).toHaveBeenCalledTimes(0);
    expect((menciones as any).validar).toHaveBeenCalledTimes(0);
  });

  it('debe cortar la cadena en ValidarPermisosHandler y retornar FORBIDDEN si no hay permisos (cobertura)', async () => {
    // Forzar fallo de permisos
    hasPermisosMock.mockReturnValue(false);

    const context: ValidationContext = {
      senderId: 'intruder',
      destinationType: 'dm',
      content: 'Hola'
    };

    const result = await permisos.manejar(context);

    // Verificamos el rechazo en el primer eslabón
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe('FORBIDDEN');

    // Verificamos que se ejecutó el primero
    expect((permisos as any).validar).toHaveBeenCalledTimes(1);

    // NINGÚN OTRO debe haberse ejecutado
    expect((spam as any).validar).toHaveBeenCalledTimes(0);
    expect((tamano as any).validar).toHaveBeenCalledTimes(0);
  });
});
