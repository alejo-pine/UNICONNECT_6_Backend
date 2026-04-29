import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { NextFunction, Request, Response } from 'express';
import { createProxyServer } from 'http-proxy';
import { SERVICES } from '../config/services';

const proxy = createProxyServer({
  changeOrigin: true,
  ws: true,
});

(proxy as any).on('error', (error: Error, req: IncomingMessage, res: ServerResponse) => {
  const message = error instanceof Error ? error.message : 'Unknown proxy error';

  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message }));
    return;
  }

  console.error('[SocketProxy] Proxy error', message, req?.url);
});

export const socketIoProxyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.url.startsWith('/socket.io')) {
    next();
    return;
  }

  proxy.web(req, res, { target: SERVICES.SOCIAL_SERVICE });
};

export const attachSocketIoUpgradeProxy = (server: HttpServer): void => {
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/socket.io')) {
      return;
    }

    proxy.ws(req, socket, head, { target: SERVICES.SOCIAL_SERVICE });
  });
};