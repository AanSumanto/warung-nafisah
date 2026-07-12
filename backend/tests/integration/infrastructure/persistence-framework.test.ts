import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoRepository } from '../../../src/infrastructure/persistence/repositories/MongoRepository.js';
import { MongoUnitOfWork } from '../../../src/infrastructure/persistence/MongoUnitOfWork.js';
import { FilterObject } from '../../../src/application/common/Filter.js';
import { SortObject } from '../../../src/application/common/Sort.js';
import {
  setupMongoMemoryServer,
  teardownMongoMemoryServer,
  clearTestCollections,
} from '../../helpers/persistence/mongo-memory.js';
import {
  TestItem,
  TestItemMapper,
  TestItemDocument,
  getTestItemModel,
} from '../../helpers/persistence/test-item.fixture.js';
import { createIdentifier } from '../../../src/domain/common/Identifier.js';

describe('Persistence Framework Integration', () => {
  const mapper = new TestItemMapper();
  let repository: MongoRepository<TestItem, TestItemDocument, string>;
  let softDeleteRepository: MongoRepository<TestItem, TestItemDocument, string>;
  let unitOfWork: MongoUnitOfWork;

  beforeAll(async () => {
    await setupMongoMemoryServer();
  });

  afterAll(async () => {
    await teardownMongoMemoryServer();
  });

  beforeEach(async () => {
    await clearTestCollections();
    unitOfWork = new MongoUnitOfWork();
    const model = getTestItemModel();
    repository = new MongoRepository(model, mapper, {}, () => unitOfWork.getActiveSession());
    softDeleteRepository = new MongoRepository(
      model,
      mapper,
      { softDelete: true },
      () => unitOfWork.getActiveSession(),
    );
  });

  describe('MongoRepository CRUD', () => {
    it('saves and finds by id', async () => {
      const item = TestItem.create('Alpha', 10);
      await repository.save(item);

      const found = await repository.findById(item.id);
      expect(found?.name).toBe('Alpha');
      expect(await repository.exists(item.id)).toBe(true);
    });

    it('updates existing entity', async () => {
      const item = TestItem.create('Beta', 1);
      await repository.save(item);
      const updated = new TestItem(item.id, 'Beta Updated', 2, item.createdAt, new Date());
      await repository.save(updated);

      const found = await repository.findById(item.id);
      expect(found?.name).toBe('Beta Updated');
      expect(found?.value).toBe(2);
    });

    it('hard deletes entity', async () => {
      const item = TestItem.create('Gamma', 3);
      await repository.save(item);
      await repository.delete(item.id);
      expect(await repository.findById(item.id)).toBeNull();
    });
  });

  describe('Pagination', () => {
    it('returns paginated results', async () => {
      for (let i = 1; i <= 5; i++) {
        await repository.save(TestItem.create(`Item ${i}`, i));
      }

      const page = await repository.findPaginated({
        pagination: { page: 1, limit: 2 },
        sort: SortObject.create().asc('value').build(),
      });

      expect(page.items).toHaveLength(2);
      expect(page.meta.total).toBe(5);
      expect(page.meta.hasNextPage).toBe(true);
    });
  });

  describe('Cursor Pagination', () => {
    it('returns cursor paginated results', async () => {
      const ids: string[] = [];
      for (let i = 1; i <= 4; i++) {
        const item = TestItem.create(`Cursor ${i}`, i);
        ids.push(item.id);
        await repository.save(item);
      }

      const first = await repository.findCursorPaginated({
        cursor: { limit: 2 },
        sort: SortObject.create().asc('_id').build(),
      });

      expect(first.items).toHaveLength(2);
      expect(first.meta.hasMore).toBe(true);

      const second = await repository.findCursorPaginated({
        cursor: { limit: 2, cursor: first.meta.nextCursor ?? undefined },
        sort: SortObject.create().asc('_id').build(),
      });

      expect(second.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Specification / Filter', () => {
    it('filters with FilterObject', async () => {
      await repository.save(TestItem.create('Match', 100));
      await repository.save(TestItem.create('Other', 1));

      const items = await repository.findAll({
        filter: FilterObject.create().eq('name', 'Match').build(),
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.name).toBe('Match');
    });
  });

  describe('Soft Delete', () => {
    it('soft deletes without removing document', async () => {
      const item = TestItem.create('Soft', 7);
      await softDeleteRepository.save(item);
      await softDeleteRepository.delete(item.id);

      const found = await softDeleteRepository.findById(item.id);
      expect(found).toBeNull();

      const raw = await getTestItemModel().findById(item.id).lean();
      expect(raw?.isDeleted).toBe(true);
      expect(raw?.deletedAt).toBeTruthy();
    });
  });

  describe('Transaction', () => {
    it('commits transaction', async () => {
      const id = createIdentifier('txn-commit-1');
      await unitOfWork.execute(async () => {
        await repository.save(new TestItem(id, 'Committed', 1, new Date(), new Date()));
      });

      const found = await repository.findById(id);
      expect(found?.name).toBe('Committed');
    });

    it('rolls back transaction on error', async () => {
      const id = createIdentifier('txn-rollback-1');

      await expect(
        unitOfWork.execute(async () => {
          await repository.save(new TestItem(id, 'Rollback', 1, new Date(), new Date()));
          throw new Error('force rollback');
        }),
      ).rejects.toThrow('force rollback');

      const found = await repository.findById(id);
      expect(found).toBeNull();
    });
  });
});
