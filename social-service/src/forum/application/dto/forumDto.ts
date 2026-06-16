export interface CreateQuestionCommand {
  subjectId: string;
  authorId: string;
  title: string;
  content: string;
}

export interface CreateAnswerCommand {
  questionId: string;
  authorId: string;
  content: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}
