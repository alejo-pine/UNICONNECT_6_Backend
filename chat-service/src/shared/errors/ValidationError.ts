// src/shared/errors/ValidationError.ts

import { AppError } from './AppError';
import { ERROR_CODES } from '../constants';

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR);
  }
}
