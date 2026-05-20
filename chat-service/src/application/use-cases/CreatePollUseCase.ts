// src/application/use-cases/CreatePollUseCase.ts

import { IWallPostRepository } from '../../domain/repositories/IWallPostRepository';
import { IPollRepository } from '../../domain/repositories/IPollRepository';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { WallPost } from '../../domain/entities/WallPost';
import { PollWithResults } from '../../domain/entities/Poll';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { ValidationError } from '../../shared/errors/ValidationError';

export interface CreatePollInput {
  groupId: string;
  senderId: string;
  question: string;
  options: string[];
  durationMinutes: number;
}

export interface WallPostWithPoll extends WallPost {
  poll: PollWithResults;
}

export class CreatePollUseCase {
  constructor(
    private readonly wallPostRepo: IWallPostRepository,
    private readonly pollRepo: IPollRepository,
    private readonly groupRepo: IGroupRepository
  ) {}

  async execute(input: CreatePollInput): Promise<WallPostWithPoll> {
    const { groupId, senderId, question, options, durationMinutes } = input;

    // 1. Validar membresía
    const isMember = await this.groupRepo.isMember(groupId, senderId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 2. Validar estructura de encuesta
    if (!question || question.trim().length === 0) {
      throw new ValidationError('Question is required');
    }
    if (!options || !Array.isArray(options) || options.length < 2) {
      throw new ValidationError('At least 2 options are required');
    }
    if (options.some((opt) => !opt || opt.trim().length === 0)) {
      throw new ValidationError('Options cannot be empty strings');
    }
    if (!durationMinutes || durationMinutes <= 0) {
      throw new ValidationError('Duration minutes must be a positive number');
    }

    // 3. Crear el post en el wall
    // El contenido del post será la pregunta para permitir visibilidad fallback.
    const post = await this.wallPostRepo.create({
      groupId,
      senderId,
      content: question.trim(),
    });

    // 4. Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // 5. Crear la encuesta vinculada al post
    const poll = await this.pollRepo.create(
      post.id,
      question.trim(),
      options.map((o) => o.trim()),
      expiresAt
    );

    return {
      ...post,
      poll,
    };
  }
}
