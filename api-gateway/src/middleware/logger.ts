import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  console.log(`[${timestamp}] ${method.padEnd(6)} ${path}`);
  
  next();
};
