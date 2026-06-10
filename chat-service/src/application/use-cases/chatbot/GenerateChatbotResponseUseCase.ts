import { IProfileReadRepository } from '../../../domain/repositories/IProfileReadRepository';
import { PromptStrategyContext } from '../../../domain/strategies/chatbot/PromptStrategyContext';
import { logger } from '../../../shared/logger';

export interface ChatbotRequestPayload {
  sessionId: string;
  action: string;
  chatInput: string;
  system_prompt: string;
}

export class GenerateChatbotResponseUseCase {
  constructor(private readonly profileReadRepository: IProfileReadRepository) {}

  async execute(userId: string, sessionId: string, message: string): Promise<ChatbotRequestPayload> {
    // 1. Obtener el rol real del usuario desde la base de datos para no confiar en el frontend
    const role = await this.profileReadRepository.getUserRole(userId);
    
    if (!role) {
      logger.warn(`No se pudo obtener el rol para el usuario ${userId}. Se usará el rol por defecto.`);
    }

    // 2. Resolver la estrategia de prompt basada en el rol
    const strategy = PromptStrategyContext.getStrategy(role || 'student');
    const systemPrompt = strategy.getSystemPrompt();

    // 3. Preparar el payload exacto para enviar al webhook de n8n
    const payload: ChatbotRequestPayload = {
      sessionId: sessionId,
      action: 'sendMessage',
      chatInput: message,
      system_prompt: systemPrompt,
    };

    // TODO: En futuras tareas, aquí se realizará la petición HTTP POST (e.g. axios.post)
    // al webhook de n8n usando process.env.N8N_WEBHOOK_URL enviando el `payload`.
    // Por ahora, cumplimos con el Criterio de Aceptación devolviendo el payload preparado
    // de manera que el pipeline RAG reciba el system_prompt sin condicionales de rol.

    return payload;
  }
}
