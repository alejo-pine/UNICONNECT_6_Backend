import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loggerMiddleware } from './middleware/logger';
import { socketIoProxyMiddleware } from './realtime/socketProxy';
import proxyRoutes from './routes/proxyRoutes';
import swaggerUi from 'swagger-ui-express';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(socketIoProxyMiddleware);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { url: '/auth/openapi.json', name: 'Auth Service' },
      { url: '/profiles/openapi.json', name: 'Profile Service' },
      { url: '/study-groups/openapi.json', name: 'Social Service' },
      { url: '/notifications/openapi.json', name: 'Notification Service' },
      { url: '/chat/openapi.json', name: 'Chat Service' }
    ]
  }
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, swaggerOptions));

app.use(proxyRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `No route found for ${req.method} ${req.path}`,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

export default app;
