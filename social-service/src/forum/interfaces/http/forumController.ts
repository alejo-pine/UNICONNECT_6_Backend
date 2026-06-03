import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { sendServiceResult } from '../../../utils/controller';
import { HttpError } from '../../../utils/httpError';
import { handleControllerError } from '../../../utils/studyGroupControllerHelper';
import {
  toQuestionApiResponse,
  toQuestionDetailApiResponseList,
  toAnswerApiResponse,
  toAnswerDetailApiResponseList,
} from './presenters/forumPresenter';
import { forumDependencies } from './dependencies';

export const createQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const subjectId = typeof payload.subject_id === 'string' ? payload.subject_id.trim() : '';
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';

    if (!subjectId) {
      throw new HttpError(400, 'Field "subject_id" is required and must be a non-empty string');
    }

    const result = await forumDependencies.createQuestionUseCase.execute({
      subjectId,
      authorId: req.user.id,
      title,
      content,
    });

    sendServiceResult(
      res,
      {
        ...result,
        data: result.data ? toQuestionApiResponse(result.data) : null,
      },
      201
    );
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.createQuestion', {
      userId: req.user?.id,
    });
  }
};

export const getForumQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const subjectId = typeof req.params.subjectId === 'string' ? req.params.subjectId.trim() : '';
    if (!subjectId) {
      throw new HttpError(400, 'Field "subjectId" is required');
    }

    const result = await forumDependencies.getForumQuestionsUseCase.execute(subjectId, req.user.id);

    sendServiceResult(res, {
      ...result,
      data: result.data ? toQuestionDetailApiResponseList(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.getForumQuestions', {
      userId: req.user?.id,
      subjectId: req.params.subjectId,
    });
  }
};

export const createAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const questionId = typeof req.params.questionId === 'string' ? req.params.questionId.trim() : '';
    if (!questionId) {
      throw new HttpError(400, 'Field "questionId" is required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';

    const result = await forumDependencies.createAnswerUseCase.execute({
      questionId,
      authorId: req.user.id,
      content,
    });

    sendServiceResult(
      res,
      {
        ...result,
        data: result.data ? toAnswerApiResponse(result.data) : null,
      },
      201
    );
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.createAnswer', {
      userId: req.user?.id,
      questionId: req.params.questionId,
    });
  }
};

export const getForumAnswers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const questionId = typeof req.params.questionId === 'string' ? req.params.questionId.trim() : '';
    if (!questionId) {
      throw new HttpError(400, 'Field "questionId" is required');
    }

    const result = await forumDependencies.getForumAnswersUseCase.execute(questionId, req.user.id);

    sendServiceResult(res, {
      ...result,
      data: result.data ? toAnswerDetailApiResponseList(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.getForumAnswers', {
      userId: req.user?.id,
      questionId: req.params.questionId,
    });
  }
};

export const voteAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const answerId = typeof req.params.answerId === 'string' ? req.params.answerId.trim() : '';
    if (!answerId) {
      throw new HttpError(400, 'Field "answerId" is required');
    }

    const result = await forumDependencies.voteAnswerUseCase.execute(answerId, req.user.id);

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.voteAnswer', {
      userId: req.user?.id,
      answerId: req.params.answerId,
    });
  }
};

export const acceptAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const answerId = typeof req.params.answerId === 'string' ? req.params.answerId.trim() : '';
    if (!answerId) {
      throw new HttpError(400, 'Field "answerId" is required');
    }

    const payload = req.body as Record<string, unknown> | null;
    let isAccepted = true;
    if (payload && (payload.is_accepted !== undefined || payload.isAccepted !== undefined)) {
      isAccepted = !!(payload.is_accepted ?? payload.isAccepted);
    }

    const result = await forumDependencies.acceptAnswerUseCase.execute(
      answerId,
      req.user.id,
      isAccepted
    );

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'forumController.acceptAnswer', {
      userId: req.user?.id,
      answerId: req.params.answerId,
    });
  }
};
