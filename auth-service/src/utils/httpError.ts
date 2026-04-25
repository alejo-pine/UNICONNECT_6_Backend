export interface HttpErrorOptions {
  code?: string;
  details?: unknown;
}

export class HttpError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, options: HttpErrorOptions = {}) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}
