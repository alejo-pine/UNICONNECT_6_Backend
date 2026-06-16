// src/application/use-cases/VoteInPollUseCase.ts

import { IPollRepository } from '../../domain/repositories/IPollRepository';
import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { PollWithResults } from '../../domain/entities/Poll';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';
import { NotFoundError } from '../../shared/errors/NotFoundError';

export interface VoteInPollInput {
  pollId: string;
  optionId: string;
  userId: string;
}

export class VoteInPollUseCase {
  constructor(
    private readonly pollRepo: IPollRepository,
    private readonly wallPostRepo: IWallPostRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: VoteInPollInput): Promise<{ poll: PollWithResults; groupId: string }> {
    const { pollId, optionId, userId } = input;

    // 1. Obtener la encuesta con resultados actuales
    const poll = await this.pollRepo.findWithResults(pollId, userId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // 2. Obtener el grupo asociado al post de la encuesta para validar membresía
    const groupId = await this.wallPostRepo.findGroupIdByPostId(poll.postId);
    if (!groupId) {
      throw new ValidationError('Wall post associated with the poll not found');
    }

    // 3. Validar membresía del votante
    const isMember = await this.groupRepo.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 4. Validar expiración (Lazy evaluation)
    const now = new Date();
    if (now > poll.expiresAt) {
      if (!poll.closed) {
        // Cierre pasivo/lazy en base de datos
        await this.pollRepo.close(pollId);
        poll.closed = true;
      }
      throw new ValidationError('The poll has expired and is no longer accepting votes');
    }

    // 5. Validar si ya está cerrada
    if (poll.closed) {
      throw new ValidationError('This poll has been closed');
    }

    // 6. Validar que la opción exista en la encuesta
    const optionExists = poll.options.some((opt) => opt.id === optionId);
    if (!optionExists) {
      throw new ValidationError('Selected option does not belong to this poll');
    }

    // 7. Validar duplicación de voto
    const alreadyVoted = await this.pollRepo.hasUserVoted(pollId, userId);
    if (alreadyVoted) {
      throw new ValidationError('You have already voted in this poll');
    }

    // 8. Registrar voto
    await this.pollRepo.registerVote(pollId, optionId, userId);

    // 9. Recuperar y retornar la encuesta con resultados actualizados
    const updatedPoll = await this.pollRepo.findWithResults(pollId, userId);
    if (!updatedPoll) {
      throw new NotFoundError('Error retrieving updated poll results');
    }

    return {
      poll: updatedPoll,
      groupId,
    };
  }
}
