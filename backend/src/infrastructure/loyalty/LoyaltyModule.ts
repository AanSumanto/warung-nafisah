import { MongoUnitOfWork } from '../persistence/MongoUnitOfWork.js';
import { CustomerService } from '../../application/loyalty/CustomerService.js';
import { LoyaltyProgramService } from '../../application/loyalty/LoyaltyProgramService.js';
import { RewardCatalogService } from '../../application/loyalty/RewardCatalogService.js';
import { LoyaltyConfigInstaller } from '../../application/loyalty/LoyaltyConfigInstaller.js';
import { LoyaltyEarnService } from '../../application/loyalty/LoyaltyEarnService.js';
import { LoyaltyReceiptProgressService } from '../../application/loyalty/LoyaltyReceiptProgressService.js';
import { LoyaltyRedemptionService } from '../../application/loyalty/LoyaltyRedemptionService.js';
import { PublicMemberRewardsService } from '../../application/loyalty/PublicMemberRewardsService.js';
import { getCustomerModel } from './documents/CustomerDocument.js';
import { getLoyaltyProgramModel } from './documents/LoyaltyProgramDocument.js';
import { getLoyaltyRewardModel } from './documents/LoyaltyRewardDocument.js';
import { getLoyaltyLedgerModel } from './documents/LoyaltyLedgerDocument.js';
import { CustomerMapper } from './mappers/CustomerMapper.js';
import { LoyaltyProgramMapper } from './mappers/LoyaltyProgramMapper.js';
import { LoyaltyRewardMapper } from './mappers/LoyaltyRewardMapper.js';
import { LoyaltyLedgerMapper } from './mappers/LoyaltyLedgerMapper.js';
import { MongoCustomerRepository } from './MongoCustomerRepository.js';
import { MongoLoyaltyProgramRepository } from './MongoLoyaltyProgramRepository.js';
import { MongoLoyaltyRewardRepository } from './MongoLoyaltyRewardRepository.js';
import { MongoLoyaltyLedgerRepository } from './MongoLoyaltyLedgerRepository.js';
import { MongoMenuReferenceLookup } from './MongoMenuReferenceLookup.js';

export function createLoyaltyModule(unitOfWork = new MongoUnitOfWork()) {
  const getSession = () => unitOfWork.getActiveSession();

  const customerRepository = new MongoCustomerRepository(
    getCustomerModel(),
    new CustomerMapper(),
    getSession,
  );
  const programRepository = new MongoLoyaltyProgramRepository(
    getLoyaltyProgramModel(),
    new LoyaltyProgramMapper(),
    getSession,
  );
  const rewardRepository = new MongoLoyaltyRewardRepository(
    getLoyaltyRewardModel(),
    new LoyaltyRewardMapper(),
    getSession,
  );
  const ledgerRepository = new MongoLoyaltyLedgerRepository(
    getLoyaltyLedgerModel(),
    new LoyaltyLedgerMapper(),
    getSession,
  );
  const menuLookup = new MongoMenuReferenceLookup();

  const customerService = new CustomerService(customerRepository);
  const loyaltyProgramService = new LoyaltyProgramService(programRepository);
  const rewardCatalogService = new RewardCatalogService(rewardRepository, menuLookup);
  const loyaltyConfigInstaller = new LoyaltyConfigInstaller(
    programRepository,
    rewardRepository,
    menuLookup,
  );
  const loyaltyEarnService = new LoyaltyEarnService(
    customerRepository,
    ledgerRepository,
    programRepository,
    unitOfWork,
  );
  const loyaltyReceiptProgressService = new LoyaltyReceiptProgressService(
    rewardRepository,
    menuLookup,
  );
  const publicMemberRewardsService = new PublicMemberRewardsService(
    customerRepository,
    programRepository,
    rewardRepository,
    menuLookup,
    ledgerRepository,
  );
  const loyaltyRedemptionService = new LoyaltyRedemptionService(
    customerRepository,
    ledgerRepository,
    programRepository,
    rewardRepository,
    menuLookup,
  );

  return {
    unitOfWork,
    customerRepository,
    programRepository,
    rewardRepository,
    ledgerRepository,
    menuLookup,
    customerService,
    loyaltyProgramService,
    rewardCatalogService,
    loyaltyConfigInstaller,
    loyaltyEarnService,
    loyaltyReceiptProgressService,
    publicMemberRewardsService,
    loyaltyRedemptionService,
  };
}

/**
 * Additive collection + index setup for loyalty collections.
 * Uses createIndexes() only — never syncIndexes / dropIndexes.
 * Does NOT seed program/rewards/ledger entries.
 */
export async function initializeLoyaltyInfrastructure(): Promise<void> {
  const models = [
    getCustomerModel(),
    getLoyaltyProgramModel(),
    getLoyaltyRewardModel(),
    getLoyaltyLedgerModel(),
  ];
  for (const model of models) {
    try {
      await model.createCollection();
    } catch {
      // already exists
    }
    await model.createIndexes();
  }
}
