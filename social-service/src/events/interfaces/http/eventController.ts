import { Response } from 'express';
import { sendServiceResult } from '../../../utils/controller';
import { eventDependencies } from './dependencies';
import { toEventCardSummaryApiResponseList, toEventDetailApiResponse } from './presenters/eventPresenter';
import { AuthenticatedRequest } from '../../../shared/http/authenticatedRequest';

export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitRaw !== undefined && !isNaN(limitRaw) ? limitRaw : 20;

  const result = await eventDependencies.getAllEventsUseCase.execute({ limit });

  sendServiceResult(
    res,
    {
      ...result,
      data: result.data ? toEventCardSummaryApiResponseList(result.data) : null,
    },
    200
  );
};

export const getEventById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = String(req.params.id);
  const userId = req.user?.id;

  const result = await eventDependencies.getEventByIdUseCase.execute(id, userId);

  sendServiceResult(
    res,
    {
      ...result,
      data: result.data ? toEventDetailApiResponse(result.data) : null,
    },
    200
  );
};

export const subscribe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { category } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const result = await eventDependencies.subscribeCategoryUseCase.execute(userId, category);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

export const getSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const categories = await eventDependencies.eventSubscriptionRepository.getUserSubscriptions(userId);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
};

export const unsubscribe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { category } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const result = await eventDependencies.unsubscribeCategoryUseCase.execute(userId, category);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, imageUrl, eventDate, eventTime, location, category, faculty } = req.body;
  const profileId = req.user?.id;

  if (!title || !category || !eventDate || !eventTime || !profileId) {
    res.status(400).json({ success: false, error: 'title, category, eventDate, eventTime and profileId are required' });
    return;
  }

  const result = await eventDependencies.createEventUseCase.execute({
    title,
    description,
    imageUrl,
    eventDate,
    eventTime,
    location,
    category,
    faculty,
    profileId
  });

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(500).json(result);
  }
};

export const registerToEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const eventId = req.params.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    await eventDependencies.registerToEventUseCase.execute({ eventId, userId });
    res.status(200).json({ success: true, message: 'Registro exitoso' });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const cancelRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const eventId = req.params.id;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    await eventDependencies.cancelEventRegistrationUseCase.execute({ eventId, userId });
    res.status(200).json({ success: true, message: 'Registro cancelado exitosamente' });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};
