import { env } from './config/env';
import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import app from './app';
import { Server } from 'http';
import { initializeJWKS } from './utils/jwksClient';

type RequestError = Error & {
  statusCode?: number;
  status?: number;
  headers?: Record<string, string>;
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

    if (typeof maybeStatusCode === 'number') {
      fallback.statusCode = maybeStatusCode;
    }
    if (typeof maybeStatus === 'number') {
      fallback.status = maybeStatus;
    }
    if (typeof maybeCode === 'string') {
      fallback.code = maybeCode;
    }
    if (maybeDetails !== undefined) {
      fallback.details = maybeDetails;
    }
  }

  return fallback;
};

const configureApp = (): typeof app => {
  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions: CorsOptions = {
    origin: env.corsAllowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth routes
  app.use('/auth', authRoutes);

  // 404 handler
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      statusCode: 404,
    });
  });

  // Error handler
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

  return app;
};

const startServer = async (): Promise<Server> => {
  try {
    // Initialize JWKS cache
    await initializeJWKS();
    console.log('[auth-service] JWKS inicializado');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.warn('[auth-service] Advertencia inicializando JWKS:', message);
    // Continue anyway - some installations may not need JWKS
  }

  configureApp();

  const server = app.listen(env.port, (): void => {
    console.log(`[auth-service] Servidor escuchando en puerto ${env.port}`);
    console.log(`[auth-service] Entorno: ${env.nodeEnv}`);
  });

  return server;
};

startServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Error desconocido';
  console.error('[auth-service] Error iniciando servidor:', message);
  process.exit(1);
});

export default app;
