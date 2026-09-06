import type { FilterQuery, Model } from 'mongoose';

/** Insert defaults once; only accept a duplicate race when the business key exists. */
export async function insertBootstrapRecord<T>(
  model: Model<T>,
  key: FilterQuery<T>,
  defaults: Partial<T>,
): Promise<void> {
  try {
    await model.updateOne(key, { $setOnInsert: defaults }, { upsert: true });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000 &&
      (await model.exists(key))
    ) {
      return;
    }
    throw error;
  }
}
