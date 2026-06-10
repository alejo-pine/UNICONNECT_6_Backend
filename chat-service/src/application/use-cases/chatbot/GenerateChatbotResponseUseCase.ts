import { IProfileReadRepository } from '../../../domain/repositories/IProfileReadRepository';
import { PromptStrategyContext } from '../../../domain/strategies/chatbot/PromptStrategyContext';
import { RoleNotSupportedError } from '../../../domain/strategies/chatbot/errors/RoleNotSupportedError';
import { logger } from '../../../shared/logger';

export interface ChatbotRequestPayload {
  sessionId: string;
  action: string;
  chatInput: string;
  system_prompt: string | null;
  error?: string;
}

export class GenerateChatbotResponseUseCase {
  constructor(private readonly profileReadRepository: IProfileReadRepository) {}

  async execute(userId: string, sessionId: string, message: string): Promise<ChatbotRequestPayload> {
    // 1. Obtener el rol real del usuario desde la base de datos para no confiar en el frontend
    const role = await this.profileReadRepository.getUserRole(userId);
    
    if (!role) {
      logger.warn(`No se pudo obtener el rol para el usuario ${userId}. Se asume rol desconocido.`);
    }

    let systemPrompt: string | null = null;
    let errorMessage: string | undefined;

    // 2. Resolver la estrategia de prompt basada en el rol, controlando excepciones
    try {
      const strategy = PromptStrategyContext.getStrategy(role || 'unknown');
      systemPrompt = strategy.getSystemPrompt();
    } catch (error) {
      if (error instanceof RoleNotSupportedError) {
        // Logueamos el evento sin quebrar la aplicación
        logger.error(`Fallo de estrategia en chatbot: ${error.message}`, { userId, role });
        
        // Asignamos un mensaje de error que será consumido por la capa de red (HTTP/Socket) 
        // para dar retroalimentación al usuario sin abortar abruptamente el pipeline.
        errorMessage = 'Tu rol actual no tiene soporte para usar el chatbot de UniConnect.';
      } else {
        // Re-lanzar si es otro tipo de error inesperado
        throw error;
      }
    }

    // 3. Preparar el payload exacto para enviar al webhook de n8n
    // Si hay un error, el 'system_prompt' viaja nulo y el 'error' notifica el estado.
    return {
      sessionId: sessionId,
      action: 'sendMessage',
      chatInput: message,
      system_prompt: systemPrompt,
      ...(errorMessage ? { error: errorMessage } : {})
    };
  }
}
