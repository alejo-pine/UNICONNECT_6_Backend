// src/application/use-cases/ClosePollUseCase.ts

import { IPollRepository } from '../../domain/repositories/IPollRepository';
import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { PollWithResults } from '../../domain/entities/Poll';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ValidationError } from '../../shared/errors/ValidationError';

export class ClosePollUseCase {
  constructor(
    private readonly pollRepo: IPollRepository,
    private readonly wallPostRepo: IWallPostRepository
  ) {}

  async execute(pollId: string, requestUserId?: string): Promise<{ poll: PollWithResults; groupId: string }> {
    // 1. Obtener los resultados actuales de la encuesta
    const poll = await this.pollRepo.findWithResults(pollId, requestUserId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Obtener el grupo asociado al post
    const groupId = await this.wallPostRepo.findGroupIdByPostId(poll.postId);
    if (!groupId) {
      throw new ValidationError('Wall post associated with the poll not found');
    }

    // 3. Si ya está cerrada, no hace falta volver a guardarla, pero retornamos el estado
    if (poll.closed) {
      return { poll, groupId };
    }

    // 4. Cerrar en base de datos
    const closedPoll = await this.pollRepo.close(pollId);

    // 5. Devolver con resultados actualizados
    const updatedPoll = await this.pollRepo.findWithResults(pollId, requestUserId);
    if (!updatedPoll) {
      throw new NotFoundError('Error retrieving closed poll results');
    }

    return {
      poll: updatedPoll,
      groupId,
    };
  }
}
