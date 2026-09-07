import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
} from '../../helpers/persistence/mongo-memory.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';
import { Customer } from '../../../src/domain/loyalty/Customer.js';
import { getCustomerModel } from '../../../src/infrastructure/loyalty/documents/CustomerDocument.js';
import { MongoCustomerRepository } from '../../../src/infrastructure/loyalty/MongoCustomerRepository.js';
import { initializeLoyaltyInfrastructure } from '../../../src/infrastructure/loyalty/LoyaltyModule.js';

describe('MongoCustomerRepository', () => {
  let repo: MongoCustomerRepository;

  beforeAll(async () => {
    await setupMongoMemoryServer();
    await initializeLoyaltyInfrastructure();
    repo = new MongoCustomerRepository(getCustomerModel());
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await getCustomerModel().deleteMany({});
  });

  it('saves and finds by id / phone / publicMemberId', async () => {
    const customer = Customer.register({
      id: 'repo-cust-1',
      phone: '081234567890',
      name: 'Siti',
      registeredBy: 'user_kasir',
    });

    await repo.save(customer);

    const byId = await repo.findById(createIdentifier('repo-cust-1'));
    expect(byId?.phoneNormalized).toBe('6281234567890');
    expect(byId?.name).toBe('Siti');

    const byPhone = await repo.findByPhoneNormalized('6281234567890');
    expect(byPhone?.id).toBe('repo-cust-1');

    const byPublic = await repo.findByPublicMemberId(customer.publicMemberId);
    expect(byPublic?.id).toBe('repo-cust-1');
  });

  it('enforces unique phoneNormalized at database level', async () => {
    const a = Customer.register({
      id: 'repo-cust-a',
      phone: '081234567890',
      registeredBy: 'user_kasir',
    });
    await repo.save(a);

    const b = Customer.register({
      id: 'repo-cust-b',
      phone: '+6281234567890',
      registeredBy: 'user_owner',
    });

    await expect(repo.save(b)).rejects.toThrow();
    expect(await getCustomerModel().countDocuments({ phoneNormalized: '6281234567890' })).toBe(1);
  });

  it('enforces unique publicMemberId at database level', async () => {
    const a = Customer.register({
      id: 'repo-cust-c',
      phone: '081211111111',
      registeredBy: 'user_kasir',
      publicMemberId: 'abcdefghijklmnopqrstuvwxyz012345',
    });
    await repo.save(a);

    const b = Customer.register({
      id: 'repo-cust-d',
      phone: '081222222222',
      registeredBy: 'user_kasir',
      publicMemberId: 'abcdefghijklmnopqrstuvwxyz012345',
    });

    await expect(repo.save(b)).rejects.toThrow();
  });
});
