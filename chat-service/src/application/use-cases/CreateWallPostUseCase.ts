// src/application/use-cases/CreateWallPostUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { WallPost, CreateWallAttachmentInput } from '../../domain/entities/WallPost';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ValidationChainFactory } from '../../infrastructure/factories/ValidationChainFactory';
import { ValidationContext } from '../../domain/validation/ValidationContext';

export interface CreateWallPostInput {
  groupId: string;
  senderId: string;
  content?: string;
  attachments?: CreateWallAttachmentInput[];
}

export class CreateWallPostUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly validationChainFactory: ValidationChainFactory
  ) {}

  async execute(input: CreateWallPostInput): Promise<WallPost> {
    // ── Patrón Chain of Responsibility: validación centralizada ─────────────
    // Construye el contexto unificado con los datos que los handlers necesitan.
    const contexto: ValidationContext = {
      senderId: input.senderId,
      destinationType: 'wall',
      content: input.content,
      attachments: input.attachments?.map((a) => ({
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        storagePath: a.storagePath,
      })),
      groupId: input.groupId,
    };

    // Cadena Wall: ValidarTamanoHandler → ValidarContenidoHandler →
    //              ValidarMencionesHandler → ValidarPermisosHandler(isMember)
    const cadena = this.validationChainFactory.crearCadenaWall();
    const resultado = await cadena.manejar(contexto);

    // ── Cortocircuito: si algún handler rechazó, lanzar el error correcto ───
    // Los bloques if de validación manual han sido reemplazados por la cadena.
    if (!resultado.valido) {
      if (resultado.codigoError === 'FORBIDDEN') {
        throw new ForbiddenError(resultado.detalle ?? 'Forbidden');
      }
      throw new ValidationError(resultado.detalle ?? 'Validation failed');
    }

    // ── Persistencia: solo se alcanza cuando valido === true ─────────────────
    const hasContent = input.content !== undefined && input.content.trim().length > 0;

    return this.wallPostRepo.create({
      groupId: input.groupId,
      senderId: input.senderId,
      content: hasContent ? input.content!.trim() : undefined,
      attachments: input.attachments,
    });
  }
}
