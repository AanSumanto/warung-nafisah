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

  async findById(id: string): Promise<LoyaltyLedgerEntry | null> {
    const session = this.getActiveSession?.() ?? null;
    const doc = await this.model.findById(id).session(session).lean();
    return doc ? this.mapper.toDomain(doc) : null;
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

  async listRecentByCustomer(customerId: string, limit: number): Promise<LoyaltyLedgerEntry[]> {
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 50);
    const session = this.getActiveSession?.() ?? null;
    const docs = await this.model
      .find({ customerId })
      .session(session)
      .sort({ occurredAt: -1, createdAt: -1 })
      .limit(safeLimit)
      .lean();
    return docs.map((d) => this.mapper.toDomain(d));
  }

  async listPageByCustomer(input: {
    readonly customerId: string;
    readonly limit: number;
    readonly beforeOccurredAt?: Date;
    readonly beforeId?: string;
    readonly type?: string;
  }): Promise<LoyaltyLedgerEntry[]> {
    const safeLimit = Math.min(Math.max(1, Math.floor(input.limit)), 50);
    const session = this.getActiveSession?.() ?? null;
    const filter: Record<string, unknown> = { customerId: input.customerId };
    if (input.type) {
      filter.type = input.type;
    }
    if (input.beforeOccurredAt && input.beforeId) {
      filter.$or = [
        { occurredAt: { $lt: input.beforeOccurredAt } },
        { occurredAt: input.beforeOccurredAt, _id: { $lt: input.beforeId } },
      ];
    }
    const docs = await this.model
      .find(filter)
      .session(session)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(safeLimit + 1)
      .lean();
    return docs.map((d) => this.mapper.toDomain(d));
  }
}
