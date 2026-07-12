import type { ClientSession } from 'mongoose';
import { OrderNumberService } from '../../domain/services/OrderNumberService.js';
import { getOrderSequenceModel } from './documents/ShiftDocument.js';

export class MongoOrderNumberGenerator {
  async next(session?: ClientSession | null): Promise<string> {
    const dayKey = OrderNumberService.dayKey(new Date());
    const model = getOrderSequenceModel();
    const updated = await model.findOneAndUpdate(
      { _id: dayKey },
      {
        $inc: { sequence: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { _id: dayKey },
      },
      { upsert: true, new: true, session: session ?? undefined },
    );

    const sequence = updated?.sequence ?? 1;
    return OrderNumberService.format(new Date(), sequence);
  }
}
