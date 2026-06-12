import { ChatbotFeedbackRepository } from '../../domain/repositories/ChatbotFeedbackRepository';
import { ChatbotFeedbackReportItem } from '../../domain/entities/ChatbotFeedback';

export class GetFeedbackReportUseCase {
  constructor(private readonly feedbackRepo: ChatbotFeedbackRepository) {}

  async execute(page: number = 1, limit: number = 10): Promise<{ data: ChatbotFeedbackReportItem[]; total: number }> {
    return this.feedbackRepo.getNegativeFeedbackReport(page, limit);
  }
}
