export interface ChatbotFeedback {
  id?: string;
  userId: string;
  question: string;
  normalizedQuestion: string;
  response: string;
  rating: boolean; // true = útil, false = no útil
  comments?: string;
  references?: any[];
  createdAt?: string;
}

export interface ChatbotFeedbackReportItem {
  normalizedQuestion: string;
  originalQuestion: string;
  frequency: number;
  lastReportedAt: string;
}
