import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttpModule from 'pino-http';
import { getCorsConfig } from './config/cors.js';
import { logger } from './config/logger.js';
import { requestContextMiddleware } from './presentation/middleware/request-context.middleware.js';
import { errorHandlerMiddleware } from './presentation/middleware/error-handler.middleware.js';
import { v1Router } from './presentation/routes/v1/index.js';
import { NotFoundException } from './core/exceptions/BaseException.js';

const pinoHttp = pinoHttpModule as unknown as (options: {
  logger: typeof logger;
  customProps?: (req: express.Request) => Record<string, unknown>;
}) => express.RequestHandler;

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());
  app.use(cors(getCorsConfig()));
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestContextMiddleware);
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          const headers = { ...req.headers };
          if (headers.authorization) {
            headers.authorization = '[REDACTED]';
          }
          return {
            method: req.method,
            url: req.url,
            headers,
          };
        },
      },
      customProps: (req: express.Request) => ({
        requestId: req.context?.requestId,
        correlationId: req.context?.correlationId,
      }),
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      name: 'Warung Nafisah ERP API',
      version: '0.10.0',
      api: '/api/v1',
    });
  });

  app.use('/api/v1', v1Router);

  app.use((_req, _res, next) => {
    next(new NotFoundException('Endpoint tidak ditemukan'));
  });

  app.use(errorHandlerMiddleware);

  return app;
}
