import type { ClientSession, Model } from 'mongoose';
import type { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import type { LoyaltyLedgerDocument } from './documents/LoyaltyLedgerDocument.js';
import { LoyaltyLedgerMapper } from './mappers/LoyaltyLedgerMapper.js';

/**
 * Append-only Mongo ledger repository.
 * Intentionally has no update/delete methods.
 */
export class MongoLoyaltyLedgerRepository implements ILoyaltyLedgerRepository {
  constructor(
    private readonly model: Model<LoyaltyLedgerDocument>,
    private readonly mapper: LoyaltyLedgerMapper = new LoyaltyLedgerMapper(),
    private readonly getActiveSession?: () => ClientSession | null,
  ) {}

  async append(entry: LoyaltyLedgerEntry): Promise<LoyaltyLedgerEntry> {
    const doc = this.mapper.toDocument(entry);
    const session = this.getActiveSession?.() ?? null;
    await this.model.create([doc], { session });
    return entry;
  }

  async findByIdempotencyKey(key: string): Promise<LoyaltyLedgerEntry | null> {
    const session = this.getActiveSession?.() ?? null;
    const doc = await this.model.findOne({ idempotencyKey: key }).session(session).lean();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findBySource(sourceType: string, sourceId: string): Promise<LoyaltyLedgerEntry[]> {
    const session = this.getActiveSession?.() ?? null;
    const docs = await this.model
      .find({ sourceType, sourceId })
      .session(session)
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((d) => this.mapper.toDomain(d));
  }

  async sumPointsDelta(customerId: string): Promise<number> {
    const session = this.getActiveSession?.() ?? null;
    const result = await this.model
      .aggregate<{ total: number }>([
        { $match: { customerId } },
        { $group: { _id: null, total: { $sum: '$pointsDelta' } } },
      ])
      .session(session);
    return result[0]?.total ?? 0;
  }

  async listByCustomer(customerId: string): Promise<LoyaltyLedgerEntry[]> {
    const session = this.getActiveSession?.() ?? null;
    const docs = await this.model
      .find({ customerId })
      .session(session)
      .sort({ occurredAt: 1, createdAt: 1 })
      .lean();
    return docs.map((d) => this.mapper.toDomain(d));
  }
}
