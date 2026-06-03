export interface QuestionAnswer {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface QuestionAnswerDetail extends QuestionAnswer {
  authorName: string;
  authorAvatar: string | null;
  voteCount: number;
  hasVoted: boolean;
}
