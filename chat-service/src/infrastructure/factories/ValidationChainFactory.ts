import { IValidadorMensajeHandler } from '../../domain/validation/IValidadorMensajeHandler';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IModerationRepository } from '../../domain/repositories/IModerationRepository';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { MODERATION_CONFIG } from '../../shared/constants';

import { ValidarTamanoHandler } from '../../application/validation/ValidarTamanoHandler';
import { ValidarAdjuntoHandler } from '../../application/validation/ValidarAdjuntoHandler';
import { ValidarContenidoHandler } from '../../application/validation/ValidarContenidoHandler';
import { ValidarMencionesHandler } from '../../application/validation/ValidarMencionesHandler';
import { ValidarPermisosHandler } from '../../application/validation/ValidarPermisosHandler';

import { LongitudHandler } from '../../application/validation/LongitudHandler';
import { PalabrasProhibidasHandler } from '../../application/validation/PalabrasProhibidasHandler';
import { SpamHandler } from '../../application/validation/SpamHandler';
import { EnlacesExternosHandler } from '../../application/validation/EnlacesExternosHandler';

export class ValidationChainFactory {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly groupRepo: IGroupRepository,
    private readonly messageRepo: IMessageRepository,
    private readonly wallPostRepo: IWallPostRepository,
    private readonly moderationRepo: IModerationRepository
  ) {}


  crearCadenaDm(): IValidadorMensajeHandler {
    const tamano = new ValidarTamanoHandler();
    const adjunto = new ValidarAdjuntoHandler();
    const contenido = new ValidarContenidoHandler();
    const menciones = new ValidarMencionesHandler();
    const permisos = new ValidarPermisosHandler(
      (ctx: ValidationContext) =>
        this.conversationRepo.isParticipant(ctx.conversationId!, ctx.senderId)
    );

    const longitud = new LongitudHandler();
    const palabras = new PalabrasProhibidasHandler([...MODERATION_CONFIG.DEFAULT_FORBIDDEN_WORDS]);
    const spam = new SpamHandler(
      (senderId, since) => this.messageRepo.countRecentMessages(senderId, since),
      this.moderationRepo
    );
    const enlaces = new EnlacesExternosHandler();

    // Orden final interlanzando CH01 y MO01
    // 1. Permisos (CH01) - Seguridad primero
    // 2. Spam (MO01) - Bloquea abusos antes de procesar
    // 3. Tamano (CH01)
    // 4. Adjunto (CH01)
    // 5. Contenido (CH01)
    // 6. Longitud (MO01) - Limita el string antes de las regex
    // 7. PalabrasProhibidas (MO01)
    // 8. EnlacesExternos (MO01)
    // 9. Menciones (CH01)
    permisos
      .setSiguiente(spam)
      .setSiguiente(tamano)
      .setSiguiente(adjunto)
      .setSiguiente(contenido)
      .setSiguiente(longitud)
      .setSiguiente(palabras)
      .setSiguiente(enlaces)
      .setSiguiente(menciones);

    return permisos;
  }


  crearCadenaWall(): IValidadorMensajeHandler {
    const tamano = new ValidarTamanoHandler();
    const adjunto = new ValidarAdjuntoHandler();
    const contenido = new ValidarContenidoHandler();
    const menciones = new ValidarMencionesHandler();
    const permisos = new ValidarPermisosHandler(
      (ctx: ValidationContext) =>
        this.groupRepo.isMember(ctx.groupId!, ctx.senderId)
    );

    const longitud = new LongitudHandler();
    const palabras = new PalabrasProhibidasHandler([...MODERATION_CONFIG.DEFAULT_FORBIDDEN_WORDS]);
    const spam = new SpamHandler(
      (senderId, since) => this.wallPostRepo.countRecentPosts(senderId, since),
      this.moderationRepo
    );
    const enlaces = new EnlacesExternosHandler();

    // Orden final interlanzando CH01 y MO01
    // 1. Permisos (CH01) - Seguridad primero
    // 2. Spam (MO01) - Bloquea abusos antes de procesar
    // 3. Tamano (CH01)
    // 4. Adjunto (CH01)
    // 5. Contenido (CH01)
    // 6. Longitud (MO01) - Limita el string antes de las regex
    // 7. PalabrasProhibidas (MO01)
    // 8. EnlacesExternos (MO01)
    // 9. Menciones (CH01)
    permisos
      .setSiguiente(spam)
      .setSiguiente(tamano)
      .setSiguiente(adjunto)
      .setSiguiente(contenido)
      .setSiguiente(longitud)
      .setSiguiente(palabras)
      .setSiguiente(enlaces)
      .setSiguiente(menciones);

    return permisos;
  }
}
