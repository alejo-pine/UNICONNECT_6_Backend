import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { attachSocketIoUpgradeProxy } from './realtime/socketProxy';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = createServer(app);

attachSocketIoUpgradeProxy(server);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       🚀 API Gateway Started           ║
╚════════════════════════════════════════╝
  
  Environment: ${NODE_ENV}
  Port: ${PORT}
  
  📡 Services:
     Auth:    ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}
     Profile: ${process.env.PROFILE_SERVICE_URL || 'http://localhost:3002'}
     Social:  ${process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003'}
  
  ✅ Gateway ready at http://localhost:${PORT}
  
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
