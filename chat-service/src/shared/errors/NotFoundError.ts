// src/shared/errors/NotFoundError.ts

import { AppError } from './AppError';
import { ERROR_CODES } from '../constants';

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}
