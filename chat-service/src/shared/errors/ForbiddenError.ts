// src/shared/errors/ForbiddenError.ts

import { AppError } from './AppError';
import { ERROR_CODES } from '../constants';

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}
