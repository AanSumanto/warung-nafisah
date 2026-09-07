import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { MongoUnitOfWork } from '../../../infrastructure/persistence/MongoUnitOfWork.js';
import { createPosModule } from '../../../infrastructure/pos/PosModule.js';
import { createLoyaltyModule } from '../../../infrastructure/loyalty/LoyaltyModule.js';
import { createPosRouter } from './pos.routes.js';
import { createCustomerRouter } from './customer.routes.js';
import { createLoyaltyConfigRouter } from './loyalty.routes.js';

const unitOfWork = new MongoUnitOfWork();
const loyaltyModule = createLoyaltyModule(unitOfWork);
const posModule = createPosModule(unitOfWork, {
  loyaltyEarnService: loyaltyModule.loyaltyEarnService,
  customerRepository: loyaltyModule.customerRepository,
  programRepository: loyaltyModule.programRepository,
});

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/', createPosRouter(posModule.posService, posModule.authService));
v1Router.use('/', createCustomerRouter(loyaltyModule.customerService, posModule.authService));
v1Router.use(
  '/',
  createLoyaltyConfigRouter(
    loyaltyModule.loyaltyProgramService,
    loyaltyModule.rewardCatalogService,
    posModule.authService,
  ),
);
