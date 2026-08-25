import { describe, it, expect } from 'vitest';
import { normalizeMongoId } from '../../../src/infrastructure/persistence/normalizeMongoId.js';
import { MenuMapper } from '../../../src/infrastructure/pos/mappers/MenuMapper.js';
import type { MenuDocument } from '../../../src/infrastructure/pos/documents/MenuDocument.js';

describe('normalizeMongoId', () => {
  it('returns trimmed string ids', () => {
    expect(normalizeMongoId(' menu_ll001 ')).toBe('menu_ll001');
  });

  it('coerces ObjectId-like values via toString()', () => {
    expect(normalizeMongoId({ toString: () => '507f1f77bcf86cd799439011' })).toBe('507f1f77bcf86cd799439011');
  });
});

describe('MenuMapper', () => {
  const mapper = new MenuMapper();

  it('maps documents whose _id is not a plain string', () => {
    const document = {
      _id: { toString: () => 'menu_custom_001' },
      kodeMenu: 'CUSTOM001',
      namaMenu: 'Menu Operator',
      tipeMenu: 'ITEM',
      kodeKategori: 'RINGAN',
      namaKategori: 'Makanan Ringan',
      hargaJual: 5_000,
      status: 'available',
      createdAt: new Date('2026-08-25T10:00:00.000Z'),
      updatedAt: new Date('2026-08-25T10:00:00.000Z'),
    } as unknown as MenuDocument;

    const menu = mapper.toDomain(document);

    expect(menu.id).toBe('menu_custom_001');
    expect(menu.kodeMenu).toBe('CUSTOM001');
  });
});
