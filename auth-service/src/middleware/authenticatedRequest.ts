import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    /** Rol de aplicación extraído del JWT (ej. 'super_admin'). Nunca consultado desde BD. */
    role?: string;
  };
}

