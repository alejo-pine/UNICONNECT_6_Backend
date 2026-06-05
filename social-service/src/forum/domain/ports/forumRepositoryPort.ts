import { SubjectQuestion, SubjectQuestionDetail } from '../entities/question';
import { QuestionAnswer, QuestionAnswerDetail } from '../entities/answer';

export interface ForumRepositoryPort {
  createQuestion(input: {
    subjectId: string;
    authorId: string;
    title: string;
    content: string;
  }): Promise<SubjectQuestion>;

  findQuestionsBySubject(subjectId: string): Promise<SubjectQuestionDetail[]>;

  findQuestionById(questionId: string): Promise<SubjectQuestionDetail | null>;

  createAnswer(input: {
    questionId: string;
    authorId: string;
    content: string;
  }): Promise<QuestionAnswer>;

  findAnswersByQuestion(
    questionId: string,
    currentProfileId: string
  ): Promise<QuestionAnswerDetail[]>;

  findAnswerById(answerId: string): Promise<QuestionAnswer | null>;

  findQuestionIdByAnswerId(answerId: string): Promise<string | null>;

  isTeacher(profileId: string, subjectId: string): Promise<boolean>;

  acceptAnswer(answerId: string, isAccepted: boolean): Promise<void>;

  clearAcceptedAnswer(questionId: string): Promise<void>;

  markQuestionResolved(questionId: string, isResolved: boolean): Promise<void>;

  hasVoted(profileId: string, answerId: string): Promise<boolean>;

  addVote(profileId: string, answerId: string): Promise<void>;

  removeVote(profileId: string, answerId: string): Promise<void>;

  verifyEnrollment(profileId: string, subjectId: string): Promise<boolean>;
}
