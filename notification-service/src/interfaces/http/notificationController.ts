import { Request, Response } from 'express';
import { notificationDependencies } from '../../dependencies';
import { sendServiceResult } from '../../utils/controller';
import { HttpError } from '../../utils/httpError';
import { CreateNotificationDto } from '../../application/dto/notificationDto';

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<CreateNotificationDto>;

  if (!body.recipientUserId || !body.title || !body.message || !body.type) {
    throw new HttpError(400, 'recipientUserId, title, message y type son requeridos');
  }

  const result = await notificationDependencies.createNotificationUseCase.execute({
    recipientUserId: body.recipientUserId,
    title: body.title,
    message: body.message,
    type: body.type,
    groupId: body.groupId,
  });

  sendServiceResult(res, result, 201);
};

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  // Read userId from header injected by API Gateway or from query param
  const userId =
    (req.headers['x-user-id'] as string) ||
    (req.query['userId'] as string) ||
    '';

  if (!userId || userId.trim().length === 0) {
    throw new HttpError(401, 'No autenticado: userId no encontrado');
  }

  const result = await notificationDependencies.getUserNotificationsUseCase.execute(userId.trim());

  sendServiceResult(res, result);
};

export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params['userId'] ?? '');

  if (!userId) {
    throw new HttpError(400, 'userId es requerido');
  }

  const result = await notificationDependencies.getUserNotificationsUseCase.execute(userId);

  sendServiceResult(res, result);
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');

  if (!id) {
    throw new HttpError(400, 'id de notificación es requerido');
  }

  const result = await notificationDependencies.markNotificationAsReadUseCase.execute(id);

  sendServiceResult(res, result);
};
