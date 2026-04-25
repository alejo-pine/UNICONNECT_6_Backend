// src/shared/errors/UnauthorizedError.ts

import { AppError } from './AppError';
import { ERROR_CODES } from '../constants';

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}
