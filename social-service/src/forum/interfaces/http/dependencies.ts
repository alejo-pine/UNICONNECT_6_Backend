import { SupabaseForumRepository } from '../../infrastructure/supabaseForumRepository';
import { CreateQuestionUseCase } from '../../application/use-cases/createQuestionUseCase';
import { GetForumQuestionsUseCase } from '../../application/use-cases/getForumQuestionsUseCase';
import { CreateAnswerUseCase } from '../../application/use-cases/createAnswerUseCase';
import { VoteAnswerUseCase } from '../../application/use-cases/voteAnswerUseCase';
import { AcceptAnswerUseCase } from '../../application/use-cases/acceptAnswerUseCase';
import { GetForumAnswersUseCase } from '../../application/use-cases/getForumAnswersUseCase';

export const forumRepository = new SupabaseForumRepository();

export const forumDependencies = {
  createQuestionUseCase: new CreateQuestionUseCase(forumRepository),
  getForumQuestionsUseCase: new GetForumQuestionsUseCase(forumRepository),
  createAnswerUseCase: new CreateAnswerUseCase(forumRepository),
  voteAnswerUseCase: new VoteAnswerUseCase(forumRepository),
  acceptAnswerUseCase: new AcceptAnswerUseCase(forumRepository),
  getForumAnswersUseCase: new GetForumAnswersUseCase(forumRepository),
};
