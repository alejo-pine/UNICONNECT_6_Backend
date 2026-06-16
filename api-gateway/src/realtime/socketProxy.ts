import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { NextFunction, Request, Response } from 'express';
import { createProxyServer } from 'http-proxy';
import { SERVICES } from '../config/services';

const proxy = createProxyServer({
  changeOrigin: true,
  ws: true,
});

(proxy as any).on('error', (error: Error, req: IncomingMessage, res: ServerResponse | any) => {
  try {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';

    if (res && typeof res.writeHead === 'function' && !res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', message }));
      return;
    }

    // If it's a socket (from WS upgrade), just end it
    if (res && typeof res.end === 'function') {
      res.end();
    }

    console.error('[SocketProxy] Proxy error', message, req?.url);
  } catch {
    // Absorb any secondary errors from already-destroyed sockets
  }
});

export const socketIoProxyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.url.startsWith('/notifications-socket/')) {
    proxy.web(req, res, { target: SERVICES.NOTIFICATION_SERVICE });
    return;
  }

  if (req.url.startsWith('/socket.io/')) {
    proxy.web(req, res, { target: SERVICES.SOCIAL_SERVICE });
    return;
  }

  next();
};

export const attachSocketIoUpgradeProxy = (server: HttpServer): void => {
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/notifications-socket/')) {
      proxy.ws(req, socket, head, { target: SERVICES.NOTIFICATION_SERVICE });
      return;
    }

    if (req.url?.startsWith('/socket.io/')) {
      proxy.ws(req, socket, head, { target: SERVICES.SOCIAL_SERVICE });
      return;
    }
  });
};