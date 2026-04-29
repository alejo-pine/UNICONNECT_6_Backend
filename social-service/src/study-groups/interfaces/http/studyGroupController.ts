import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { sendServiceResult } from '../../../utils/controller';
import { HttpError } from '../../../utils/httpError';
import { handleControllerError } from '../../../utils/studyGroupControllerHelper';
import { toStudyGroupApiResponse, toStudyGroupApiResponseList } from './presenters/studyGroupPresenter';
import { studyGroupDependencies } from './dependencies';

export const createStudyGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const name = typeof payload.name === 'string' ? payload.name : '';
    const description = typeof payload.description === 'string' ? payload.description : '';
    const subjectId = typeof payload.subject_id === 'string' ? payload.subject_id : '';

    const result = await studyGroupDependencies.createStudyGroupUseCase.execute({
      name,
      description,
      subjectId,
      creatorId: req.user.id,
    });

    sendServiceResult(
      res,
      {
        ...result,
        data: result.data ? toStudyGroupApiResponse(result.data) : null,
      },
      201
    );
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.createStudyGroup', {
      userId: (req.user as { id?: string } | undefined)?.id,
    });
  }
};

export const getMyStudyGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const result = await studyGroupDependencies.getMyStudyGroupsUseCase.execute(req.user.id);

    sendServiceResult(res, {
      ...result,
      data: result.data ? toStudyGroupApiResponseList(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getMyStudyGroups', {
      userId: (req.user as { id?: string } | undefined)?.id,
    });
  }
};

export const getAllStudyGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const limit = !isNaN(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 50;

    const result = await studyGroupDependencies.getAllStudyGroupsUseCase.execute(limit);

    sendServiceResult(res, {
      ...result,
      data: result.data ? toStudyGroupApiResponseList(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getAllStudyGroups', { limit: 50 });
  }
};

export const getAvailableStudyGroupsBySubject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const subjectId = typeof req.params.subjectId === 'string' ? req.params.subjectId.trim() : '';
    if (!subjectId) {
      throw new HttpError(400, 'Field "subjectId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.getAvailableStudyGroupsBySubjectUseCase.execute(
      subjectId,
      req.user.id
    );

    sendServiceResult(res, {
      ...result,
      data: result.data ? toStudyGroupApiResponseList(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getAvailableStudyGroupsBySubject', {
      userId: (req.user as { id?: string } | undefined)?.id,
      subjectId: req.params?.subjectId,
    });
  }
};

export const getStudyGroupDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.getStudyGroupDetailUseCase.execute(groupId);
    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getStudyGroupDetail', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const joinStudyGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.joinStudyGroupUseCase.execute({
      groupId,
      profileId: req.user.id,
    });

    sendServiceResult(res, {
      ...result,
      data: result.data ? toStudyGroupApiResponse(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.joinStudyGroup', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const leaveStudyGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.leaveStudyGroupUseCase.execute({
      groupId,
      profileId: req.user.id,
    });

    sendServiceResult(res, {
      ...result,
      data: result.data ? toStudyGroupApiResponse(result.data) : null,
    });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.leaveStudyGroup', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const acceptStudyGroupRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    const requestedUserId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    if (!requestedUserId) {
      throw new HttpError(400, 'Field "userId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.acceptStudyGroupRequestUseCase.execute({
      groupId,
      currentUserId: req.user.id,
      requestedUserId,
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.acceptStudyGroupRequest', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
      requestedUserId: req.params?.userId,
    });
  }
};

export const rejectStudyGroupRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    const requestedUserId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    if (!requestedUserId) {
      throw new HttpError(400, 'Field "userId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.rejectStudyGroupRequestUseCase.execute({
      groupId,
      currentUserId: req.user.id,
      requestedUserId,
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.rejectStudyGroupRequest', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
      requestedUserId: req.params?.userId,
    });
  }
};

export const transferStudyGroupAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const newAdminUserId =
      typeof payload.newAdminUserId === 'string' ? payload.newAdminUserId.trim() : '';
    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    if (!newAdminUserId) {
      throw new HttpError(400, 'Field "newAdminUserId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.initiateAdminTransferUseCase.execute({
      groupId,
      currentUserId: req.user.id,
      newAdminUserId,
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.transferStudyGroupAdmin', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const initiateAdminTransfer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const newAdminUserId =
      typeof payload.newAdminUserId === 'string' ? payload.newAdminUserId.trim() : '';
    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    if (!newAdminUserId) {
      throw new HttpError(400, 'Field "newAdminUserId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.initiateAdminTransferUseCase.execute({
      groupId,
      currentUserId: req.user.id,
      newAdminUserId,
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.initiateAdminTransfer', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const respondAdminTransfer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    if (typeof req.body !== 'object' || req.body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const payload = req.body as Record<string, unknown>;
    const action =
      typeof payload.action === 'string' ? payload.action.trim() : '';
    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    if (!action) {
      throw new HttpError(400, 'Field "action" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.respondAdminTransferUseCase.execute({
      groupId,
      respondingUserId: req.user.id,
      action: action as 'accept' | 'reject',
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.respondAdminTransfer', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};
