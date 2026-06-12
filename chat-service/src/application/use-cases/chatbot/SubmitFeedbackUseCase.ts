import { ChatbotFeedbackRepository } from '../../domain/repositories/ChatbotFeedbackRepository';
import { ChatbotFeedback } from '../../domain/entities/ChatbotFeedback';
import { SupabaseClient } from '@supabase/supabase-js';

// We need an interface for the payload
export interface SubmitFeedbackPayload {
  userId: string;
  question: string;
  response: string;
  rating: boolean;
  comments?: string;
  references?: any[];
}

export class SubmitFeedbackUseCase {
  constructor(
    private readonly feedbackRepo: ChatbotFeedbackRepository,
    private readonly supabase: SupabaseClient // Need this to find super_admin and insert notification directly or fetch
  ) {}

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^\w\s]|_/g, '') // remove punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  async execute(payload: SubmitFeedbackPayload): Promise<ChatbotFeedback> {
    const normalizedQuestion = this.normalizeText(payload.question);

    const feedbackToSave: ChatbotFeedback = {
      userId: payload.userId,
      question: payload.question,
      normalizedQuestion,
      response: payload.response,
      rating: payload.rating,
      comments: payload.comments,
      references: payload.references,
    };

    const saved = await this.feedbackRepo.save(feedbackToSave);

    // If it's negative feedback, check if we reached the threshold of 3
    if (!payload.rating) {
      const count = await this.feedbackRepo.countNegativeFeedbackByQuestion(normalizedQuestion);
      
      // If it's exactly 3 (to avoid sending email on 4, 5, etc. or we can do >=3 and check if already sent)
      // For simplicity, trigger at exactly 3
      if (count === 3) {
        await this.notifySuperAdmins(payload.question, count);
      }
    }

    return saved;
  }

  private async notifySuperAdmins(originalQuestion: string, count: number) {
    try {
      // Find all super admins
      const { data: admins } = await this.supabase
        .from('profile')
        .select('id')
        .eq('role', 'super_admin');

      if (!admins || admins.length === 0) return;

      for (const admin of admins) {
        // Send notification via database insertion which the notification-service reads
        // OR using the API. In UniConnect, usually we insert into "notifications" table directly 
        // if using shared DB, or call the API.
        await this.supabase.from('notifications').insert({
          recipient_user_id: admin.id,
          title: 'Alerta de Feedback Chatbot',
          message: `La pregunta "${originalQuestion}" ha recibido ${count} calificaciones de "No útil".`,
          type: 'SISTEMA',
          is_read: false,
          created_at: new Date().toISOString()
        });
        
        // As SendGrid is configured in notification-service, inserting the notification 
        // with type 'SISTEMA' or similar might trigger an email if notification-service is listening to DB,
        // or we could explicitly do a POST to notification-service.
        // As notification-service is running on port 3005 and its endpoint is /notifications
        try {
          await fetch('http://localhost:3005/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientUserId: admin.id,
              title: 'Alerta de Feedback Chatbot',
              message: `La pregunta "${originalQuestion}" ha recibido ${count} calificaciones de "No útil".`,
              type: 'SISTEMA',
              emailHtml: `<p>La pregunta <strong>${originalQuestion}</strong> ha recibido ${count} calificaciones de "No útil". Revisa el panel de administración para mejorar la respuesta.</p>`
            })
          });
        } catch (e) {
          console.error('Error calling notification API', e);
        }
      }
    } catch (error) {
      console.error('Error notifying super admins:', error);
    }
  }
}
