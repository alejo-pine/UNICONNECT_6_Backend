import express, { Express } from 'express';

const app: Express = express();
app.set('trust proxy', 1);

export default app;
