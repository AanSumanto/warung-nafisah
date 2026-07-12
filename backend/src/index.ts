import express from 'express';
import { createApp } from './app.js';
import { bootstrapInfrastructure } from './bootstrap.js';

let bootstrapPromise: Promise<void> | null = null;

function ensureInfrastructureReady(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapInfrastructure();
  }
  return bootstrapPromise;
}

const api = createApp();
const app = express();

app.use(async (_req, _res, next) => {
  try {
    await ensureInfrastructureReady();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(api);

export default app;
