import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { config } from './config/env.js';

export function createApp() {
  const app = express();

  const allowedOrigins = config.corsOrigin
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.corsOrigin === '*') return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req: express.Request, res: express.Response) => {
    res.json({ success: true, message: 'PropIntel AI API is running', code: 'OK' });
  });

  app.use('/api', router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
