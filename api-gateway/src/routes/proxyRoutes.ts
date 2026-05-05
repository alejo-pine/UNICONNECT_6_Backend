import { Router, Request, Response } from 'express';
import axios from 'axios';
import { SERVICES } from '../config/services';

const router = Router();

const proxyRequest = async (
  req: Request,
  res: Response,
  baseURL: string,
  pathOverride?: string
): Promise<void> => {
  try {
    const queryString = Object.keys(req.query).length 
      ? `?${new URLSearchParams(req.query as any).toString()}`
      : '';
    
    // Si pathOverride se proporciona (ej. remover /api), usar ese
    const targetPath = pathOverride || req.path;
    const targetUrl = `${baseURL}${targetPath}${queryString}`;

    console.log(`[ProxyRequest] ${req.method} ${req.path}`);
    console.log(`[ProxyRequest] Target URL: ${targetUrl}`);
    console.log(`[ProxyRequest] Headers:`, { 
      authorization: req.headers.authorization ? '***' : 'MISSING',
      contentType: req.headers['content-type']
    });
    console.log(`[ProxyRequest] Body:`, req.body);

    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['content-length'];
    delete headers['connection'];
    // Eliminar headers de caché que causan 304
    delete headers['if-none-match'];
    delete headers['if-modified-since'];
    // Forzar respuesta sin compresión desde los microservicios
    // para evitar que axios reciba bytes gzip y los reenvíe corruptos
    delete headers['accept-encoding'];
    headers['accept-encoding'] = 'identity';

    const config = {
      method: req.method as any,
      url: targetUrl,
      headers,
      data: req.body,
      validateStatus: () => true,
      // Desactivar descompresión automática de axios para control total
      decompress: true,
    };

    console.log(`[ProxyRequest] Enviando petición a microservicio...`);
    const response = await axios(config);

    console.log(`[ProxyRequest] Respuesta recibida: ${response.status}`);
    console.log(`[ProxyRequest] Response body:`, response.data);

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`[ProxyRequest] ✗ Proxy error for ${req.path}:`, error.message);
    res.status(500).json({
      error: 'Internal Gateway Error',
      message: error.message,
    });
  }
};

router.all('/auth', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.AUTH_SERVICE);
});

router.all('/auth/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.AUTH_SERVICE);
});

router.all('/api/auth', async (req: Request, res: Response) => {
  // Remover /api del path antes de reenviar
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.AUTH_SERVICE, pathWithoutApi);
});

router.all('/api/auth/*', async (req: Request, res: Response) => {
  // Remover /api del path antes de reenviar
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.AUTH_SERVICE, pathWithoutApi);
});

router.all('/profiles', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/profiles/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/api/profiles', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/api/profiles/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/profile-subjects', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/profile-subjects/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/api/profile-subjects', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/api/profile-subjects/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/groups', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/groups/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/api/groups', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/api/groups/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/events', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/events/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/api/events', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/api/events/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/subjects', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/subjects/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/api/subjects', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/api/subjects/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/students', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/students/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/api/students', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/api/students/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/onboarding', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/onboarding/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE);
});

router.all('/api/onboarding', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/api/onboarding/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.PROFILE_SERVICE, pathWithoutApi);
});

router.all('/study-groups', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/study-groups/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/api/study-groups', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/api/study-groups/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/notifications', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/notifications/*', async (req: Request, res: Response) => {
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE);
});

router.all('/api/notifications', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.all('/api/notifications/*', async (req: Request, res: Response) => {
  const pathWithoutApi = req.path.replace(/^\/api/, '');
  await proxyRequest(req, res, SERVICES.SOCIAL_SERVICE, pathWithoutApi);
});

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

export default router;
