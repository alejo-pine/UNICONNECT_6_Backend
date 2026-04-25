import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { sendServiceResult } from '../../../utils/controller';
import { studentDependencies } from './dependencies';

export const getClassmates: RequestHandler<{ subjectId: string }> = async (
  req,
  res
): Promise<void> => {
  const { subjectId } = req.params;
  const currentProfileId = (req as unknown as AuthenticatedRequest).user.id;

  const result = await studentDependencies.getClassmatesBySubjectUseCase.execute(
    subjectId,
    currentProfileId
  );
  sendServiceResult(res, result, 200);
};
