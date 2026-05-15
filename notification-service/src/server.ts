import { env } from './config/env';
import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initSocketIO } from './realtime/socketManager';
import notificationRoutes from './routes/notificationRoutes';
import app from './app';

type RequestError = Error & {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: unknown;
};

const normalizeRequestError = (err: unknown): RequestError => {
  if (err instanceof Error) {
    return err as RequestError;
  }

  const fallback = new Error(
    typeof err === 'string' ? err : 'Error desconocido en el servidor'
  ) as RequestError;

  if (typeof err === 'object' && err !== null) {
    const maybeStatusCode = (err as { statusCode?: unknown }).statusCode;
    const maybeStatus = (err as { status?: unknown }).status;
    const maybeCode = (err as { code?: unknown }).code;
    const maybeDetails = (err as { details?: unknown }).details;

    if (typeof maybeStatusCode === 'number') fallback.statusCode = maybeStatusCode;
    if (typeof maybeStatus === 'number') fallback.status = maybeStatus;
    if (typeof maybeCode === 'string') fallback.code = maybeCode;
    if (maybeDetails !== undefined) fallback.details = maybeDetails;
  }

  return fallback;
};

const configureApp = (): void => {
  app.use(helmet());

  const corsOptions: CorsOptions = {
    origin: env.corsAllowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  });
  app.use(limiter);

  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/notifications', notificationRoutes);

  app.use((_req: Request, res: Response): void => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      statusCode: 404,
    });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const error = normalizeRequestError(err);
    const statusCode = error.statusCode ?? error.status ?? 500;
    const message = error.message ?? 'Error interno del servidor';

    res.status(statusCode).json({
      error: message,
      statusCode,
      ...(env.nodeEnv === 'development' && { details: error.details, code: error.code }),
    });
  });
};

const startServer = async (): Promise<void> => {
  configureApp();

  const httpServer = createServer(app);

  initSocketIO(httpServer, env.corsAllowedOrigins);

  httpServer.listen(env.port, (): void => {
    console.log(`[notification-service] Servidor escuchando en puerto ${env.port}`);
    console.log(`[notification-service] Entorno: ${env.nodeEnv}`);
    console.log(`[notification-service] Socket.io activo`);
  });
};

startServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Error desconocido';
  console.error('[notification-service] Error iniciando servidor:', message);
  process.exit(1);
});

export default app;
