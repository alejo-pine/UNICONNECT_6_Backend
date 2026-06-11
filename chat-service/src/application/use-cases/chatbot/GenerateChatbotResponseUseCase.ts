import axios from 'axios';
import { IProfileReadRepository } from '../../../domain/repositories/IProfileReadRepository';
import { IChatbotRepository } from '../../../domain/repositories/IChatbotRepository';
import { PromptStrategyContext } from '../../../domain/strategies/chatbot/PromptStrategyContext';
import { RoleNotSupportedError } from '../../../domain/strategies/chatbot/errors/RoleNotSupportedError';
import { ChatbotMessageReference } from '../../../domain/entities/chatbot';
import { logger } from '../../../shared/logger';

export interface GenerateChatbotResponseInput {
  userId: string;
  message: string;
  conversationId?: string;
}

export interface ChatbotResponsePayload {
  conversationId: string | null;
  reply: string | null;
  references?: ChatbotMessageReference[] | null;
  status: 'success' | 'error' | 'timeout' | 'role_not_supported';
  error?: string;
}

export class GenerateChatbotResponseUseCase {
  constructor(
    private readonly profileReadRepository: IProfileReadRepository,
    private readonly chatbotRepository: IChatbotRepository
  ) {}

  async execute(input: GenerateChatbotResponseInput): Promise<ChatbotResponsePayload> {
    const { userId, message } = input;
    let conversationId = input.conversationId;

    logger.info(`[Chatbot] Iniciando ejecución para userId: ${userId}, conversationId: ${conversationId || 'NUEVA'}`);

    // 1. Manejo de Conversación
    try {
      if (!conversationId) {
        const newConv = await this.chatbotRepository.createConversation(userId);
        conversationId = newConv.id;
      } else {
        const conv = await this.chatbotRepository.getConversationById(conversationId);
        if (!conv || conv.userId !== userId) {
          logger.warn(`[Chatbot] Conversación ${conversationId} no existe o no pertenece al usuario. Creando una nueva fallback.`);
          const newConv = await this.chatbotRepository.createConversation(userId);
          conversationId = newConv.id;
        }
      }

      // Guardar el mensaje del usuario
      await this.chatbotRepository.saveMessage({
        conversationId,
        role: 'user',
        content: message,
      });
    } catch (dbError) {
      logger.error('Error gestionando la conversación en base de datos', { error: dbError });
      return {
        conversationId: conversationId || null,
        reply: null,
        status: 'error',
        error: 'No se pudo guardar la conversación.',
      };
    }

    // 2. Obtener historial para n8n
    let history: any[] = [];
    try {
      const messages = await this.chatbotRepository.getConversationMessages(conversationId, 10);
      // Formatear para n8n: excluir el mensaje actual que vamos a enviar en el root
      const prevMessages = messages.filter(m => m.role !== 'system');
      // Eliminamos el último si es el que acabamos de meter
      if (prevMessages.length > 0 && prevMessages[prevMessages.length - 1].content === message) {
        prevMessages.pop();
      }
      history = prevMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
    } catch (histError) {
      logger.warn(`[Chatbot] Error obteniendo historial, se enviará vacío`, { error: histError });
    }

    // 3. Obtener el rol real del usuario desde la base de datos
    const role = await this.profileReadRepository.getUserRole(userId);
    if (!role) {
      logger.warn(`[Chatbot] No se pudo obtener el rol para el usuario ${userId}. Se asume desconocido.`);
    }

    let systemPrompt: string | null = null;
    try {
      const strategy = PromptStrategyContext.getStrategy(role || 'unknown');
      systemPrompt = strategy.getSystemPrompt();
    } catch (error) {
      if (error instanceof RoleNotSupportedError) {
        logger.error(`Fallo de estrategia en chatbot: ${error.message}`, { userId, role });
        return {
          conversationId,
          reply: null,
          status: 'role_not_supported',
          error: 'Tu rol actual no tiene soporte para usar el chatbot de UniConnect.',
        };
      }
      throw error;
    }

    // 4. Integración real con n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl || webhookUrl.trim() === '') {
      logger.error('[Chatbot] N8N_WEBHOOK_URL no está configurada o está vacía.');
      return {
        conversationId,
        reply: null,
        status: 'error',
        error: 'Error de configuración del sistema (Webhook no configurado).',
      };
    }

    // Validar formato de URL para evitar ERR_INVALID_URL
    try {
      new URL(webhookUrl);
    } catch (urlError) {
      logger.error(`[Chatbot] N8N_WEBHOOK_URL tiene un formato inválido: ${webhookUrl}`);
      return {
        conversationId,
        reply: null,
        status: 'error',
        error: 'Error de configuración del sistema (URL del webhook inválida).',
      };
    }

    const n8nPayload = {
      message,
      system_prompt: systemPrompt,
      conversationId,
      history,
    };

    try {
      logger.info(`[Chatbot] Enviando petición POST a n8n: ${webhookUrl}`, { payloadKeys: Object.keys(n8nPayload) });
      const n8nResponse = await axios.post(webhookUrl, n8nPayload, {
        timeout: 25000, // 25 segundos timeout
        headers: { 'Content-Type': 'application/json' }
      });

      logger.info(`[Chatbot] Respuesta exitosa recibida de n8n con status: ${n8nResponse.status}`);
      const replyData = n8nResponse.data;

      // n8n a veces devuelve un array con un objeto dentro, manejamos ambos casos
      let dataObj = replyData;
      if (Array.isArray(replyData) && replyData.length > 0) {
        dataObj = replyData[0];
      }

      const fallbackMsg = 'Disculpa, en este momento el servidor está experimentando un alto volumen de consultas o hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo en unos momentos.';
      const assistantMessage = dataObj?.reply || dataObj?.response || fallbackMsg;
      const references = dataObj?.references || null;

      // 5. Guardar respuesta del asistente
      await this.chatbotRepository.saveMessage({
        conversationId,
        role: 'assistant',
        content: assistantMessage,
        references,
      });

      return {
        conversationId,
        reply: assistantMessage,
        references,
        status: 'success',
      };

    } catch (axiosError: any) {
      logger.error(`[Chatbot] Error llamando a n8n webhook: ${axiosError.message}`, { code: axiosError.code, response: axiosError.response?.data });
      
      // Manejo de Timeout o Degradación
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        logger.warn(`[Chatbot] Timeout alcanzado en n8n webhook (25s).`);
        return {
          conversationId,
          reply: null,
          status: 'timeout',
          error: 'El asistente tardó demasiado en responder. Por favor, intenta de nuevo más tarde.',
        };
      }

      return {
        conversationId,
        reply: null,
        status: 'error',
        error: 'El asistente no está disponible en este momento.',
      };
    }
  }
}
