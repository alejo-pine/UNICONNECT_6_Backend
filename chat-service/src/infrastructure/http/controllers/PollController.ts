// src/infrastructure/http/controllers/PollController.ts

import { Request, Response, NextFunction } from 'express';
import { CreatePollUseCase } from '../../../application/use-cases/CreatePollUseCase';
import { VoteInPollUseCase } from '../../../application/use-cases/VoteInPollUseCase';
import { ClosePollUseCase } from '../../../application/use-cases/ClosePollUseCase';
import { ValidationError } from '../../../shared/errors/ValidationError';
import { ISubject } from '../../../domain/observer/ISubject';
import { MensajeBase } from '../../../domain/mensaje/MensajeBase';
import { ArchivoAdjuntoDecorator } from '../../../domain/mensaje/ArchivoAdjuntoDecorator';
import { MencionDecorator } from '../../../domain/mensaje/MencionDecorator';
import { EncuestaDecorator } from '../../../domain/mensaje/EncuestaDecorator';
import { SOCKET_EVENTS } from '../../../shared/constants';

export class PollController {
  constructor(
    private readonly createPollUseCase: CreatePollUseCase,
    private readonly voteInPollUseCase: VoteInPollUseCase,
    private readonly closePollUseCase: ClosePollUseCase,
    private readonly chatSubject: ISubject
  ) {}

  createPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { groupId } = req.params as { groupId: string };
      const body = req.body as {
        question?: unknown;
        options?: unknown;
        durationMinutes?: unknown;
      };

      if (typeof body.question !== 'string' || body.question.trim() === '') {
        throw new ValidationError('question is required and must be a non-empty string');
      }
      if (!Array.isArray(body.options) || body.options.length < 2) {
        throw new ValidationError('options must be an array with at least 2 items');
      }
      const durationMinutes = Number(body.durationMinutes);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new ValidationError('durationMinutes must be a positive number');
      }

      const postWithPoll = await this.createPollUseCase.execute({
        groupId,
        senderId: req.userId,
        question: body.question,
        options: body.options.map(String),
        durationMinutes,
      });

      // Aplicar Decoradores de Mensaje al Post con Encuesta
      const rawPayload: Record<string, unknown> = {
        id: postWithPoll.id,
        groupId: postWithPoll.groupId,
        senderId: postWithPoll.senderId,
        senderName: postWithPoll.senderName,
        avatarUrl: postWithPoll.avatarUrl,
        content: postWithPoll.content,
        attachments: [],
        createdAt: postWithPoll.createdAt.toISOString(),
      };

      const conAdjuntos = new ArchivoAdjuntoDecorator(new MensajeBase(rawPayload), []);
      const conMenciones = new MencionDecorator(conAdjuntos);
      const conEncuesta = new EncuestaDecorator(conMenciones, postWithPoll.poll);
      const enrichedPayload = conEncuesta.getPayload();

      // Notificar al Subject para emisión en tiempo real
      this.chatSubject.notify(SOCKET_EVENTS.WALL_POLL_CREATED, enrichedPayload);

      res.status(201).json(postWithPoll);
    } catch (error) {
      next(error);
    }
  };

  vote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { pollId } = req.params as { pollId: string };
      const { optionId } = req.body as { optionId?: unknown };

      if (typeof optionId !== 'string' || optionId.trim() === '') {
        throw new ValidationError('optionId is required and must be a non-empty string');
      }

      const result = await this.voteInPollUseCase.execute({
        pollId,
        optionId,
        userId: req.userId,
      });

      // Notificar al Subject el voto registrado
      this.chatSubject.notify(SOCKET_EVENTS.WALL_POLL_VOTED, {
        poll: result.poll,
        groupId: result.groupId,
      });

      res.status(200).json(result.poll);
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { pollId } = req.params as { pollId: string };

      const result = await this.closePollUseCase.execute(pollId, req.userId);

      // Notificar al Subject el cierre de encuesta
      this.chatSubject.notify(SOCKET_EVENTS.WALL_POLL_CLOSED, {
        poll: result.poll,
        groupId: result.groupId,
      });

      res.status(200).json(result.poll);
    } catch (error) {
      next(error);
    }
  };
}
