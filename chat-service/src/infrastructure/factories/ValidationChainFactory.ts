import { IValidadorMensajeHandler } from '../../domain/validation/IValidadorMensajeHandler';
import { IConversationRepository } from '../../domain/repositories/IConversationRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { ValidationContext } from '../../domain/validation/ValidationContext';

import { ValidarTamanoHandler } from '../../application/validation/ValidarTamanoHandler';
import { ValidarAdjuntoHandler } from '../../application/validation/ValidarAdjuntoHandler';
import { ValidarContenidoHandler } from '../../application/validation/ValidarContenidoHandler';
import { ValidarMencionesHandler } from '../../application/validation/ValidarMencionesHandler';
import { ValidarPermisosHandler } from '../../application/validation/ValidarPermisosHandler';

export class ValidationChainFactory {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly groupRepo: IGroupRepository
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

    tamano.setSiguiente(adjunto).setSiguiente(contenido).setSiguiente(menciones).setSiguiente(permisos);

    return tamano;
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

    tamano.setSiguiente(adjunto).setSiguiente(contenido).setSiguiente(menciones).setSiguiente(permisos);

    return tamano;
  }
}
