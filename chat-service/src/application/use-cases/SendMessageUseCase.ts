import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { Message, CreateMessageInput, CreateAttachmentInput } from '../../domain/entities/Message';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ModerationError } from '../../shared/errors/ModerationError';
import { ValidationChainFactory } from '../../infrastructure/factories/ValidationChainFactory';
import { ValidationContext } from '../../domain/validation/ValidationContext';
import { IModerationRepository } from '../../domain/repositories/IModerationRepository';
import { MODERATION_RULES_EXPLANATIONS } from '../../shared/constants';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: CreateAttachmentInput[];
}

export class SendMessageUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly validationChainFactory: ValidationChainFactory,
    private readonly moderationRepo: IModerationRepository
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const contexto: ValidationContext = {
      senderId: input.senderId,
      destinationType: 'dm',
      content: input.content,
      attachments: input.attachments?.map((a) => ({
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        storagePath: a.storagePath,
      })),
      conversationId: input.conversationId,
    };

    const cadena = this.validationChainFactory.crearCadenaDm();
    const resultado = await cadena.manejar(contexto);

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
                  console.error('[Moderation DM] Error en la red al llamar a notification-service:', escalationError);
                });
              }
            } catch (escalationError) {
              console.error('SendMessageUseCase: Failed to execute escalation logic', escalationError);
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

    const hasContent = input.content !== undefined && input.content.trim().length > 0;

    const createInput: CreateMessageInput = {
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: hasContent ? input.content!.trim() : undefined,
      attachments: input.attachments,
    };

    const message = await this.messageRepo.create(createInput);

    try {
      const messagesCount = await this.messageRepo.countSentMessages(input.senderId);
      if (messagesCount === 10) {
        const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
        await fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: input.senderId,
            title: '💬 Insignia Desbloqueada: Sociable',
            message: 'Enviasta más de 10 mensajes.',
            type: 'SISTEMA',
            read: false,
          }),
        });
      }
    } catch (badgeError) {
      console.error('SendMessageUseCase: Failed to check/notify badge', badgeError);
    }

    return message;
  }
}
