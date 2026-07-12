import { describe, expect, it } from 'vitest';
import { Menu } from '../../../src/domain/pos/Menu.js';
import { OrderItem } from '../../../src/domain/pos/OrderItem.js';

describe('Menu domain', () => {
  it('requires integer hargaJual', () => {
    expect(() =>
      Menu.create('m1', {
        kodeMenu: 'LL001',
        namaMenu: 'Lele',
        tipeMenu: 'ITEM',
        kodeKategori: 'PECEL',
        namaKategori: 'Pecel Lele',
        hargaJual: 18_000.5,
        status: 'available',
      }),
    ).toThrow();
  });

  it('accepts BUNDLE with bundleItems structure', () => {
    const menu = Menu.create('m2', {
      kodeMenu: 'PKT001',
      namaMenu: 'Lele + Nasi Putih',
      tipeMenu: 'BUNDLE',
      kodeKategori: 'PECEL',
      namaKategori: 'Pecel Lele',
      hargaJual: 15_000,
      status: 'available',
      bundleItems: [
        { kodeMenu: 'LL001', qty: 1 },
        { kodeMenu: 'NAS001', qty: 1 },
      ],
    });

    expect(menu.tipeMenu).toBe('BUNDLE');
    expect(menu.bundleItems).toHaveLength(2);
  });
});

describe('OrderItem snapshot', () => {
  it('stores immutable snapshot fields with integer subtotal', () => {
    const props = OrderItem.snapshotFromMenu({
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      kodeKategori: 'PECEL',
      namaKategori: 'Pecel Lele',
      tipeMenu: 'ITEM',
      hargaJual: 11_000,
      qty: 2,
    });

    const item = new OrderItem('line-1', props);
    expect(item.toJSON()).toMatchObject({
      kodeMenu: 'LL001',
      namaMenu: 'Lele',
      kodeKategori: 'PECEL',
      namaKategori: 'Pecel Lele',
      tipeMenu: 'ITEM',
      hargaJual: 11_000,
      qty: 2,
      subtotal: 22_000,
    });
  });
});
