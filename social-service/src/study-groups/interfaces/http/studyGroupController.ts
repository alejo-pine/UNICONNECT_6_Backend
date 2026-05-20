import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';
import { sendServiceResult } from '../../../utils/controller';
import { HttpError } from '../../../utils/httpError';
import { handleControllerError } from '../../../utils/studyGroupControllerHelper';
import { toStudyGroupApiResponse, toStudyGroupApiResponseList } from './presenters/studyGroupPresenter';
import { studyGroupDependencies } from './dependencies';
import { CreateResourceUseCase } from '../../application/use-cases/createResourceUseCase';
import { ExtractOpenGraphUseCase } from '../../application/use-cases/extractOpenGraphUseCase';
import { EditResourceUseCase } from '../../application/use-cases/editResourceUseCase';
import { supabase } from '../../../utils/supabaseClient';

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

export const getGroupMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';

    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
    }

    const result = await studyGroupDependencies.getStudyGroupMembersUseCase.execute(groupId, req.user.id);

    sendServiceResult(
      res,
      {
        ...result,
        data: result.data || null,
      },
      200
    );
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getGroupMembers', {
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

export const createStudySession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required');
    }

    const payload = req.body;
    const result = await studyGroupDependencies.createStudySessionUseCase.execute({
      groupId,
      creatorId: req.user.id,
      name: payload.name,
      description: payload.description,
      location: payload.location,
      startTime: payload.startTime,
      endTime: payload.endTime,
      recurrenceType: payload.recurrenceType || 'none',
      recurrenceEndDate: payload.recurrenceEndDate,
    });

    sendServiceResult(res, { data: result, error: null, statusCode: 201 });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.createStudySession', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const updateStudySession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId.trim() : '';
    if (!sessionId) {
      throw new HttpError(400, 'Field "sessionId" is required');
    }

    const payload = req.body;

    // Frontend sends: { name, description, updateMode, fromDate }
    // updateMode from frontend can be 'this' | 'future' — map to backend 'single' | 'future'
    const rawMode: string = payload.updateMode || 'single';
    const updateMode: 'single' | 'future' = rawMode === 'future' ? 'future' : 'single';

    const result = await studyGroupDependencies.updateStudySessionUseCase.execute({
      sessionId,
      updaterId: req.user.id,
      updateMode,
      updates: {
        name: payload.name ?? payload.updates?.name,
        description: payload.description ?? payload.updates?.description,
        location: payload.location ?? payload.updates?.location,
        startTime: payload.startTime ?? payload.updates?.startTime,
        endTime: payload.endTime ?? payload.updates?.endTime,
      },
    });

    sendServiceResult(res, { data: result, error: null, statusCode: 200 });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.updateStudySession', {
      userId: (req.user as { id?: string } | undefined)?.id,
      sessionId: req.params?.sessionId,
    });
  }
};

export const getStudySessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required');
    }

    const result = await studyGroupDependencies.getStudySessionsUseCase.execute(groupId);
    sendServiceResult(res, { data: result, error: null, statusCode: 200 });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getStudySessions', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const extractOpenGraph = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!url) {
      throw new HttpError(400, 'Query param "url" is required');
    }

    const useCase = new ExtractOpenGraphUseCase();
    const result = await useCase.execute(url);

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.extractOpenGraph', {
      userId: (req.user as { id?: string } | undefined)?.id,
    });
  }
};

export const createResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required');
    }

    const payload = req.body;
    
    const useCase = new CreateResourceUseCase();
    const result = await useCase.execute({
      groupId,
      userId: req.user.id,
      url: payload.url,
      title: payload.title || '',
      description: payload.description || '',
      imageUrl: payload.imageUrl || '',
      roleRequired: payload.roleRequired || 'member'
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.createResource', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const getGroupResources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    if (!groupId) {
      throw new HttpError(400, 'Field "groupId" is required');
    }

    // Obtenemos los recursos directamente. Gracias a las RLS de Supabase,
    // el usuario solo recibirá los recursos a los que tiene acceso.
    const { data, error } = await supabase
      .from('group_resources')
      .select(`
        id,
        group_id,
        url,
        title,
        description,
        image_url,
        role_required,
        created_at,
        uploaded_by,
        metadata
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    sendServiceResult(res, { data, error: null, statusCode: 200 });
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.getGroupResources', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
    });
  }
};

export const editResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const groupId = typeof req.params.groupId === 'string' ? req.params.groupId.trim() : '';
    const resourceId = typeof req.params.resourceId === 'string' ? req.params.resourceId.trim() : '';

    if (!groupId || !resourceId) {
      throw new HttpError(400, 'Fields "groupId" and "resourceId" are required');
    }

    const payload = req.body;
    
    const useCase = new EditResourceUseCase();
    const result = await useCase.execute({
      resourceId,
      groupId,
      userId: req.user.id,
      title: payload.title,
      description: payload.description,
      roleRequired: payload.roleRequired,
      metadata: payload.metadata
    });

    sendServiceResult(res, result);
  } catch (err: unknown) {
    handleControllerError(err, res, 'studyGroupController.editResource', {
      userId: (req.user as { id?: string } | undefined)?.id,
      groupId: req.params?.groupId,
      resourceId: req.params?.resourceId,
    });
  }
};
