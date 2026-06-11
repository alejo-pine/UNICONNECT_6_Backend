export interface ChatbotConversation {
  id: string;
  userId: string;
  createdAt: Date;
  lastMessageAt: Date;
}

export type ChatbotMessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface ChatbotMessageReference {
  title: string;
  url: string;
  [key: string]: any;
}

export interface ChatbotMessage {
  id: string;
  conversationId: string;
  role: ChatbotMessageRole;
  content: string;
  references?: ChatbotMessageReference[] | null;
  createdAt: Date;
}
