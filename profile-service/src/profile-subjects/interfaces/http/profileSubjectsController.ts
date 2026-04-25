import { Request, Response } from 'express';
import { sendServiceResult } from '../../../utils/controller';
import { HttpError } from '../../../utils/httpError';
import { profileSubjectsDependencies } from './dependencies';

interface ProfileSubjectBody {
  profile_id?: unknown;
  subject_id?: unknown;
}

const parseNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const getSubjectsByProfile = async (
  req: Request<{ profile_id: string }>,
  res: Response
): Promise<void> => {
  const profile_id = parseNonEmptyString(req.params.profile_id);

  if (!profile_id) {
    throw new HttpError(400, 'profile_id es obligatorio');
  }

  const result = await profileSubjectsDependencies.getSubjectsInfoByProfileUseCase.execute(profile_id);
  sendServiceResult(res, result, 200);
};

export const addSubjectToProfileController = async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as ProfileSubjectBody;
  const profile_id = parseNonEmptyString(body.profile_id);
  const subject_id = parseNonEmptyString(body.subject_id);

  if (!profile_id || !subject_id) {
    throw new HttpError(400, 'profile_id y subject_id son obligatorios');
  }

  const result = await profileSubjectsDependencies.addSubjectToProfileUseCase.execute(
    profile_id,
    subject_id
  );
  sendServiceResult(res, result);
};

export const removeSubjectFromProfileController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = (req.body ?? {}) as ProfileSubjectBody;
  const profile_id = parseNonEmptyString(body.profile_id);
  const subject_id = parseNonEmptyString(body.subject_id);

  if (!profile_id || !subject_id) {
    throw new HttpError(400, 'profile_id y subject_id son obligatorios');
  }

  const result = await profileSubjectsDependencies.removeSubjectFromProfileUseCase.execute(
    profile_id,
    subject_id
  );
  sendServiceResult(res, result);
};
