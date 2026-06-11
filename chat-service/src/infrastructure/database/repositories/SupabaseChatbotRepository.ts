import { SupabaseClient } from '@supabase/supabase-js';
import { IChatbotRepository } from '../../../domain/repositories/IChatbotRepository';
import { ChatbotConversation, ChatbotMessage } from '../../../domain/entities/chatbot';
import { logger } from '../../../shared/logger';

export class SupabaseChatbotRepository implements IChatbotRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createConversation(userId: string): Promise<ChatbotConversation> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error || !data) {
      logger.error('Error creating chatbot conversation', { error: error?.message, userId });
      throw new Error('No se pudo crear la conversación del chatbot.');
    }

    return {
      id: data.id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      lastMessageAt: new Date(data.last_message_at),
    };
  }

  async getConversationById(conversationId: string): Promise<ChatbotConversation | null> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching chatbot conversation', { error: error.message, conversationId });
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      lastMessageAt: new Date(data.last_message_at),
    };
  }

  async getUserConversations(userId: string): Promise<ChatbotConversation[]> {
    const { data, error } = await this.supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error || !data) {
      logger.error('Error fetching user chatbot conversations', { error: error?.message, userId });
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      createdAt: new Date(d.created_at),
      lastMessageAt: new Date(d.last_message_at),
    }));
  }

  async saveMessage(message: Omit<ChatbotMessage, 'id' | 'createdAt'>): Promise<ChatbotMessage> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .insert([{
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
        manual_references: message.references || null,
      }])
      .select()
      .single();

    if (error || !data) {
      logger.error('Error saving chatbot message', { error: error?.message, conversationId: message.conversationId });
      throw new Error('No se pudo guardar el mensaje del chatbot.');
    }

    return {
      id: data.id,
      conversationId: data.conversation_id,
      role: data.role,
      content: data.content,
      references: data.manual_references,
      createdAt: new Date(data.created_at),
    };
  }

  async getConversationMessages(conversationId: string, limit: number = 50): Promise<ChatbotMessage[]> {
    const { data, error } = await this.supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // Queremos los últimos N
      .limit(limit);

    if (error || !data) {
      logger.error('Error fetching chatbot messages', { error: error?.message, conversationId });
      return [];
    }

    // Retornamos ordenados cronológicamente (ascending)
    const sortedData = data.reverse();

    return sortedData.map((d: any) => ({
      id: d.id,
      conversationId: d.conversation_id,
      role: d.role,
      content: d.content,
      references: d.manual_references,
      createdAt: new Date(d.created_at),
    }));
  }
}
