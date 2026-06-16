export interface SubjectQuestion {
  id: string;
  subjectId: string;
  authorId: string;
  title: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
}

export interface SubjectQuestionDetail extends SubjectQuestion {
  authorName: string;
  authorAvatar: string | null;
  answerCount: number;
}
