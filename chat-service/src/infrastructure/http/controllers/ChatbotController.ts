import { Request, Response } from 'express';
import { GenerateChatbotResponseUseCase } from '../../../application/use-cases/chatbot/GenerateChatbotResponseUseCase';
import { ListChatbotConversationsUseCase } from '../../../application/use-cases/chatbot/ListChatbotConversationsUseCase';
import { GetChatbotConversationMessagesUseCase } from '../../../application/use-cases/chatbot/GetChatbotConversationMessagesUseCase';
import { logger } from '../../../shared/logger';

export class ChatbotController {
  constructor(
    private readonly generateResponseUseCase: GenerateChatbotResponseUseCase,
    private readonly listConversationsUseCase: ListChatbotConversationsUseCase,
    private readonly getMessagesUseCase: GetChatbotConversationMessagesUseCase
  ) {}

  /**
   * Endpoint: POST /api/chatbot/message
   * 
   * @description Contrato Frontend -> Backend:
   * Body:
   * {
   *    "message": string,
   *    "conversationId"?: string // Opcional, para continuar historial
   * }
   * 
   * Contrato Backend -> Frontend (ChatbotResponsePayload):
   * {
   *    "conversationId": string,
   *    "reply": string | null, // null si hubo error o timeout
   *    "references": Array<{ title: string, url: string }> | null,
   *    "status": 'success' | 'error' | 'timeout' | 'role_not_supported',
   *    "error": string | null // mensaje descriptivo del error
   * }
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId; // Obtenido del middleware extractUserId
      const { message, conversationId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'El campo message es requerido' });
        return;
      }

      const result = await this.generateResponseUseCase.execute({
        userId,
        message,
        conversationId,
      });

      // Retornar 200 siempre que sea un error manejado, para que el frontend pueda renderizarlo
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error no manejado en ChatbotController.sendMessage', { error: error.message });
      res.status(500).json({
        conversationId: null,
        reply: null,
        status: 'error',
        error: 'Ocurrió un error inesperado al procesar el mensaje.',
      });
    }
  }

  /**
   * Endpoint: GET /api/chatbot/conversations
   */
  async listConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const conversations = await this.listConversationsUseCase.execute(userId);
      res.status(200).json({ data: conversations });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al listar las conversaciones.' });
    }
  }

  /**
   * Endpoint: GET /api/chatbot/conversations/:id/messages
   */
  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const conversationId = req.params.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const messages = await this.getMessagesUseCase.execute(userId, conversationId);
      res.status(200).json({ data: messages });
    } catch (error: any) {
      const isNotFound = error.message.includes('autorizada');
      res.status(isNotFound ? 403 : 500).json({ error: error.message });
    }
  }
}
