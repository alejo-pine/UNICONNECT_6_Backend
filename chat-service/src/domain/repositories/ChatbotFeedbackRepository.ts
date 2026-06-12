import { ChatbotFeedback, ChatbotFeedbackReportItem } from '../entities/ChatbotFeedback';

export interface ChatbotFeedbackRepository {
  save(feedback: ChatbotFeedback): Promise<ChatbotFeedback>;
  countNegativeFeedbackByQuestion(normalizedQuestion: string): Promise<number>;
  getNegativeFeedbackReport(page: number, limit: number): Promise<{ data: ChatbotFeedbackReportItem[]; total: number }>;
}
