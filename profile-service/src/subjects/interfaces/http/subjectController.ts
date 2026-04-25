import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { sendServiceResult } from '../../../utils/controller';
import { subjectDependencies } from './dependencies';
import { toSubjectApiResponse } from './presenters/subjectPresenter';

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const programFromProgram =
    typeof req.query.program === 'string' ? req.query.program.trim() : undefined;
  const programFromCareer =
    typeof req.query.career === 'string' ? req.query.career.trim() : undefined;
  const program = (programFromProgram || programFromCareer || '').trim() || undefined;
  const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitRaw !== undefined && !isNaN(limitRaw) ? limitRaw : 20;

  const result = await subjectDependencies.getAllSubjectsUseCase.execute({
    search: search || undefined,
    limit,
    program,
  });

  sendServiceResult(res, result, 200);
};

export const getSubjectById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const result = await subjectDependencies.getSubjectByIdUseCase.execute(id);

  sendServiceResult(
    res,
    {
      ...result,
      data: result.data ? toSubjectApiResponse(result.data) : null,
    },
    200
  );
};

export const getMySubjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
      return;
    }

    const result = await subjectDependencies.getMySubjectsUseCase.execute(req.user.id);
    sendServiceResult(res, result, 200);
  } catch (_err: unknown) {
    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
