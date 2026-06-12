import { SupabaseClient } from '@supabase/supabase-js';
import { ChatbotFeedback, ChatbotFeedbackReportItem } from '../../../domain/entities/ChatbotFeedback';
import { ChatbotFeedbackRepository } from '../../../domain/repositories/ChatbotFeedbackRepository';

export class SupabaseChatbotFeedbackRepository implements ChatbotFeedbackRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(feedback: ChatbotFeedback): Promise<ChatbotFeedback> {
    const { error, data } = await this.supabase
      .from('chatbot_feedback')
      .insert({
        user_id: feedback.userId,
        question: feedback.question,
        normalized_question: feedback.normalizedQuestion,
        response: feedback.response,
        rating: feedback.rating,
        comments: feedback.comments,
        references: feedback.references,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save chatbot feedback: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      question: data.question,
      normalizedQuestion: data.normalized_question,
      response: data.response,
      rating: data.rating,
      comments: data.comments,
      references: data.references,
      createdAt: data.created_at,
    };
  }

  async countNegativeFeedbackByQuestion(normalizedQuestion: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('chatbot_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('normalized_question', normalizedQuestion)
      .eq('rating', false);

    if (error) {
      throw new Error(`Failed to count negative feedback: ${error.message}`);
    }

    return count || 0;
  }

  async getNegativeFeedbackReport(page: number, limit: number): Promise<{ data: ChatbotFeedbackReportItem[]; total: number }> {
    // Because Supabase doesn't have a direct GROUP BY with pagination via JS client easily
    // We can use a raw SQL RPC function, but for now we can fetch all or a grouped view
    // Since we don't have an RPC defined, we'll fetch negative feedbacks and group in memory if needed,
    // OR we can create an RPC. Let's assume we can fetch them and group them here for simplicity.
    
    // Better approach: fetch all negative feedback, group by normalized_question, sort by freq desc
    const { data, error } = await this.supabase
      .from('chatbot_feedback')
      .select('question, normalized_question, created_at')
      .eq('rating', false);

    if (error) {
      throw new Error(`Failed to get feedback report: ${error.message}`);
    }

    const groups: Record<string, ChatbotFeedbackReportItem> = {};
    for (const row of data || []) {
      const key = row.normalized_question;
      if (!groups[key]) {
        groups[key] = {
          normalizedQuestion: key,
          originalQuestion: row.question,
          frequency: 0,
          lastReportedAt: row.created_at,
        };
      }
      groups[key].frequency += 1;
      if (new Date(row.created_at) > new Date(groups[key].lastReportedAt)) {
        groups[key].lastReportedAt = row.created_at;
      }
    }

    const reportItems = Object.values(groups).sort((a, b) => b.frequency - a.frequency);
    
    // Pagination
    const start = (page - 1) * limit;
    const paginatedItems = reportItems.slice(start, start + limit);

    return {
      data: paginatedItems,
      total: reportItems.length,
    };
  }
}
