import { IChatbotRepository } from '../../../domain/repositories/IChatbotRepository';
import { ChatbotMessage } from '../../../domain/entities/chatbot';
import { logger } from '../../../shared/logger';

export class GetChatbotConversationMessagesUseCase {
  constructor(private readonly chatbotRepository: IChatbotRepository) {}

  async execute(userId: string, conversationId: string): Promise<ChatbotMessage[]> {
    try {
      // Validate conversation belongs to user
      const conv = await this.chatbotRepository.getConversationById(conversationId);
      if (!conv || conv.userId !== userId) {
        throw new Error('Conversación no encontrada o no autorizada');
      }

      return await this.chatbotRepository.getConversationMessages(conversationId, 100);
    } catch (error: any) {
      logger.error('Error in GetChatbotConversationMessagesUseCase', { userId, conversationId, error: error.message });
      throw new Error('No se pudieron obtener los mensajes');
    }
  }
}
