// src/application/use-cases/CreateWallPostUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { WallPost, CreateWallAttachmentInput } from '../../domain/entities/WallPost';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ModerationError } from '../../shared/errors/ModerationError';
import { ValidationChainFactory } from '../../infrastructure/factories/ValidationChainFactory';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { IModerationRepository } from '../../domain/repositories/IModerationRepository';
import { MODERATION_RULES_EXPLANATIONS } from '../../shared/constants';

export interface CreateWallPostInput {
  groupId: string;
  senderId: string;
  content?: string;
  attachments?: CreateWallAttachmentInput[];
}

export class CreateWallPostUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly validationChainFactory: ValidationChainFactory,
    private readonly moderationRepo: IModerationRepository
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

      let escalated = false;
      let ruleExplanation: string | undefined;

      if (resultado.codigoError?.startsWith('MO_')) {
        ruleExplanation = MODERATION_RULES_EXPLANATIONS[resultado.codigoError];

        if (resultado.nuevoBloqueo) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const blocks = await this.moderationRepo.contarBloqueosRecientes(input.senderId, oneHourAgo);

          if (blocks === 3) {
            escalated = true;
            
            // Notify super_admin
            try {
              const superAdminId = await this.moderationRepo.getSuperAdminId();
              if (superAdminId) {
                const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
                // Fire-and-forget para no bloquear el hilo de ejecución ni retrasar la respuesta (criterio < 500ms)
                fetch(notificationUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipientUserId: superAdminId,
                    title: '🚨 Escalamiento de Moderación',
                    message: `El usuario ${input.senderId} ha alcanzado 3 bloqueos en la última hora. Requiere revisión humana.`,
                    type: 'SISTEMA',
                  }),
                }).catch(escalationError => {
                  console.error('[Moderation Wall] Error en la red al llamar a notification-service:', escalationError);
                });
              }
            } catch (escalationError) {
              console.error('CreateWallPostUseCase: Failed to execute escalation logic', escalationError);
            }
          }
        }

        throw new ModerationError(
          resultado.detalle ?? 'Validation failed',
          resultado.codigoError,
          escalated,
          ruleExplanation
        );
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
