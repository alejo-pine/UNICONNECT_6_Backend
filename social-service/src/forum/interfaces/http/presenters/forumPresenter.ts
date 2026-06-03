import { SubjectQuestion, SubjectQuestionDetail } from '../../../domain/entities/question';
import { QuestionAnswer, QuestionAnswerDetail } from '../../../domain/entities/answer';

export interface SubjectQuestionApiResponse {
  id: string;
  subject_id: string;
  author_id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  created_at: string;
}

export interface SubjectQuestionDetailApiResponse extends SubjectQuestionApiResponse {
  author_name: string;
  author_avatar: string | null;
  answer_count: number;
}

export interface QuestionAnswerApiResponse {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
}

export interface QuestionAnswerDetailApiResponse extends QuestionAnswerApiResponse {
  author_name: string;
  author_avatar: string | null;
  vote_count: number;
  has_voted: boolean;
}

export const toQuestionApiResponse = (input: SubjectQuestion): SubjectQuestionApiResponse => ({
  id: input.id,
  subject_id: input.subjectId,
  author_id: input.authorId,
  title: input.title,
  content: input.content,
  is_resolved: input.isResolved,
  created_at: input.createdAt,
});

export const toQuestionDetailApiResponse = (
  input: SubjectQuestionDetail
): SubjectQuestionDetailApiResponse => ({
  id: input.id,
  subject_id: input.subjectId,
  author_id: input.authorId,
  title: input.title,
  content: input.content,
  is_resolved: input.isResolved,
  created_at: input.createdAt,
  author_name: input.authorName,
  author_avatar: input.authorAvatar,
  answer_count: input.answerCount,
});

export const toQuestionDetailApiResponseList = (
  inputs: SubjectQuestionDetail[]
): SubjectQuestionDetailApiResponse[] => inputs.map(toQuestionDetailApiResponse);

export const toAnswerApiResponse = (input: QuestionAnswer): QuestionAnswerApiResponse => ({
  id: input.id,
  question_id: input.questionId,
  author_id: input.authorId,
  content: input.content,
  is_accepted: input.isAccepted,
  created_at: input.createdAt,
});

export const toAnswerDetailApiResponse = (
  input: QuestionAnswerDetail
): QuestionAnswerDetailApiResponse => ({
  id: input.id,
  question_id: input.questionId,
  author_id: input.authorId,
  content: input.content,
  is_accepted: input.isAccepted,
  created_at: input.createdAt,
  author_name: input.authorName,
  author_avatar: input.authorAvatar,
  vote_count: input.voteCount,
  has_voted: input.hasVoted,
});

export const toAnswerDetailApiResponseList = (
  inputs: QuestionAnswerDetail[]
): QuestionAnswerDetailApiResponse[] => inputs.map(toAnswerDetailApiResponse);
