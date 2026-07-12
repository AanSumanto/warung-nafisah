import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { createPosModule } from '../../../infrastructure/pos/PosModule.js';
import { createPosRouter } from './pos.routes.js';

const posModule = createPosModule();

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/', createPosRouter(posModule.posService, posModule.authService));
