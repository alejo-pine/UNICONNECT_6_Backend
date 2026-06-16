// src/domain/mensaje/EncuestaDecorator.ts

import { IMensaje } from './IMensaje';
import { PollWithResults } from '../entities/Poll';

export class EncuestaDecorator implements IMensaje {
  constructor(
    private readonly wrapped: IMensaje,
    private readonly poll: PollWithResults | null
  ) {}

  getPayload(): Record<string, unknown> {
    const base = this.wrapped.getPayload();
    
    if (!this.poll) {
      return base;
    }

    return {
      ...base,
      poll: {
        id: this.poll.id,
        postId: this.poll.postId,
        question: this.poll.question,
        expiresAt: this.poll.expiresAt.toISOString(),
        closed: this.poll.closed,
        createdAt: this.poll.createdAt.toISOString(),
        options: this.poll.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          votesCount: opt.votesCount,
          percentage: opt.percentage,
        })),
        userVotedOptionId: this.poll.userVotedOptionId,
      },
    };
  }
}
