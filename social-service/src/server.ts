import express from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { checkDatabaseConnection } from './config/database';
import { initializeJWKS } from './utils/jwksClient';
import { studyGroupRepository } from './study-groups/interfaces/http/dependencies';
import studyGroupsRouter from './study-groups/interfaces/http/studyGroupRoutes';
import eventsRouter from './events/interfaces/http/eventRoutes';
import app from './app';
import { initStudyGroupSocketServer } from './infrastructure/socket/studyGroupSocketServer';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================
app.use('/study-groups', studyGroupsRouter);
app.use('/events', eventsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' });
});

// Swagger UI endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  try {
    const docsPath = path.resolve(__dirname, '../docs/openapi.json');
    if (fs.existsSync(docsPath)) {
      const spec = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
      res.setHeader('Content-Type', 'application/json');
      res.send(spec);
    } else {
      res.status(404).json({ error: 'OpenAPI spec not found. Did you run build:openapi?' });
    }
  } catch (error) {
    console.error('Error reading openapi.json:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================
const start = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing social-service...');

    // Initialize JWKS for JWT verification
    try {
      await initializeJWKS();
      console.log('✅ JWKS initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize JWKS, JWT verification may fail:', error);
    }

    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('❌ Failed to connect to database');
    }
    console.log('✅ Database connection verified');

    const httpServer = createServer(app);
    initStudyGroupSocketServer(httpServer, studyGroupRepository);

    // Start server
    const port = env.port;
    httpServer.listen(port, () => {
      console.log(`✅ Social-service running on port ${port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to start server:', message);
    process.exit(1);
  }
};

start();
