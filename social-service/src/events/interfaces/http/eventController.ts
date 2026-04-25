import { Request, Response } from 'express';
import { sendServiceResult } from '../../../utils/controller';
import { eventDependencies } from './dependencies';
import { toEventCardSummaryApiResponseList, toEventDetailApiResponse } from './presenters/eventPresenter';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
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
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const result = await eventDependencies.getEventByIdUseCase.execute(id);

  sendServiceResult(
    res,
    {
      ...result,
      data: result.data ? toEventDetailApiResponse(result.data) : null,
    },
    200
  );
};
