import { ChatbotConversation, ChatbotMessage } from '../entities/chatbot';

export interface IChatbotRepository {
  createConversation(userId: string): Promise<ChatbotConversation>;
  getConversationById(conversationId: string): Promise<ChatbotConversation | null>;
  getUserConversations(userId: string): Promise<ChatbotConversation[]>;
  saveMessage(message: Omit<ChatbotMessage, 'id' | 'createdAt'>): Promise<ChatbotMessage>;
  getConversationMessages(conversationId: string, limit?: number): Promise<ChatbotMessage[]>;
}
