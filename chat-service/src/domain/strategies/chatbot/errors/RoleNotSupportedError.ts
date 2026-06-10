export class RoleNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleNotSupportedError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
