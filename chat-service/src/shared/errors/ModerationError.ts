// src/shared/errors/ModerationError.ts

import { AppError } from './AppError';

export class ModerationError extends AppError {
  public readonly moderationCode: string;
  public readonly escalated: boolean;
  public readonly ruleExplanation?: string;

  constructor(
    message: string,
    moderationCode: string,
    escalated: boolean = false,
    ruleExplanation?: string
  ) {
    super(message, 400, 'VALIDATION_ERROR'); // Mantener el status y código general para el frontend si lo requiere, o usar MODERATION_ERROR
    this.moderationCode = moderationCode;
    this.escalated = escalated;
    this.ruleExplanation = ruleExplanation;
  }
}
