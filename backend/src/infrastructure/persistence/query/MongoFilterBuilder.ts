import type { FilterCondition, FilterGroup } from '../../../application/common/Filter.js';

export type MongoFilter = Record<string, unknown>;

export class MongoFilterBuilder {
  static build(group: FilterGroup): MongoFilter {
    if (group.conditions.length === 0) return {};

    const clauses = group.conditions.map((c) => this.buildCondition(c));
    return group.logic === 'and' ? { $and: clauses } : { $or: clauses };
  }

  static buildCondition(condition: FilterCondition): MongoFilter {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        return { [field]: value };
      case 'ne':
        return { [field]: { $ne: value } };
      case 'gt':
        return { [field]: { $gt: value } };
      case 'gte':
        return { [field]: { $gte: value } };
      case 'lt':
        return { [field]: { $lt: value } };
      case 'lte':
        return { [field]: { $lte: value } };
      case 'in':
        return { [field]: { $in: value } };
      case 'nin':
        return { [field]: { $nin: value } };
      case 'contains':
        return { [field]: { $regex: escapeRegex(String(value)), $options: 'i' } };
      case 'startsWith':
        return { [field]: { $regex: `^${escapeRegex(String(value))}`, $options: 'i' } };
      case 'endsWith':
        return { [field]: { $regex: `${escapeRegex(String(value))}$`, $options: 'i' } };
      case 'exists':
        return { [field]: { $exists: Boolean(value) } };
      default:
        return { [field]: value };
    }
  }

  static withSoftDelete(base: MongoFilter = {}): MongoFilter {
    return {
      $and: [base, { isDeleted: { $ne: true } }],
    };
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
