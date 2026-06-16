import { IChatbotRepository } from '../../../domain/repositories/IChatbotRepository';
import { ChatbotConversation } from '../../../domain/entities/chatbot';
import { logger } from '../../../shared/logger';

export class ListChatbotConversationsUseCase {
  constructor(private readonly chatbotRepository: IChatbotRepository) {}

  async execute(userId: string): Promise<ChatbotConversation[]> {
    try {
      return await this.chatbotRepository.getUserConversations(userId);
    } catch (error: any) {
      logger.error('Error in ListChatbotConversationsUseCase', { userId, error: error.message });
      throw new Error('No se pudieron listar las conversaciones');
    }
  }
}
