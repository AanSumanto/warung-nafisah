import type { ClientSession, Model } from 'mongoose';
import type { Identifier } from '../../domain/common/Identifier.js';
import type { Customer } from '../../domain/loyalty/Customer.js';
import type {
  CustomerEarnMutation,
  CustomerEarnMutationResult,
  ICustomerRepository,
} from '../../domain/loyalty/ICustomerRepository.js';
import { FilterObject } from '../../application/common/Filter.js';
import { MongoRepository } from '../persistence/repositories/MongoRepository.js';
import type { CustomerDocument } from './documents/CustomerDocument.js';
import { CustomerMapper } from './mappers/CustomerMapper.js';

/**
 * Customer repository — narrow contract over MongoRepository.
 * applyEarnMutation uses atomic $inc within the active session for concurrency safety.
 */
export class MongoCustomerRepository implements ICustomerRepository {
  private readonly repo: MongoRepository<Customer, CustomerDocument>;
  private readonly model: Model<CustomerDocument>;
  private readonly getActiveSession?: () => ClientSession | null;

  constructor(
    model: Model<CustomerDocument>,
    mapper: CustomerMapper = new CustomerMapper(),
    getActiveSession?: () => ClientSession | null,
  ) {
    this.model = model;
    this.getActiveSession = getActiveSession;
    this.repo = new MongoRepository(model, mapper, {}, getActiveSession);
  }

  save(customer: Customer): Promise<Customer> {
    return this.repo.save(customer);
  }

  findById(id: Identifier): Promise<Customer | null> {
    return this.repo.findById(id);
  }

  async findByPhoneNormalized(phoneNormalized: string): Promise<Customer | null> {
    const results = await this.repo.findAll({
      filter: FilterObject.create().eq('phoneNormalized', phoneNormalized).build(),
    });
    return results[0] ?? null;
  }

  async findByPublicMemberId(publicMemberId: string): Promise<Customer | null> {
    const results = await this.repo.findAll({
      filter: FilterObject.create().eq('publicMemberId', publicMemberId).build(),
    });
    return results[0] ?? null;
  }

  async applyEarnMutation(
    customerId: Identifier,
    mutation: CustomerEarnMutation,
  ): Promise<CustomerEarnMutationResult> {
    const session = this.getActiveSession?.() ?? null;
    const updated = await this.model
      .findOneAndUpdate(
        { _id: customerId, status: 'active' },
        {
          $inc: {
            currentPoints: mutation.pointsDelta,
            lifetimeEarnedPoints: mutation.pointsDelta,
            totalSpending: mutation.eligiblePaidAmount,
            transactionCount: 1,
          },
          $set: {
            lastTransactionAt: mutation.occurredAt,
            updatedAt: new Date(),
          },
        },
        { new: true, session },
      )
      .lean();

    if (!updated) {
      throw new Error('CUSTOMER_EARN_MUTATION_FAILED');
    }

    return {
      currentPoints: updated.currentPoints,
      lifetimeEarnedPoints: updated.lifetimeEarnedPoints,
      totalSpending: updated.totalSpending,
      transactionCount: updated.transactionCount,
      lastTransactionAt: updated.lastTransactionAt as Date,
    };
  }
}
