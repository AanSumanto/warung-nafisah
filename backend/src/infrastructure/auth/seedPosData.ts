import bcrypt from 'bcryptjs';
import { getMenuModel } from '../pos/documents/MenuDocument.js';
import { getUserModel } from './documents/UserDocument.js';
import type { BundleComponent } from '../../domain/pos/PosTypes.js';

interface SeedMenu {
  readonly _id: string;
  readonly kodeMenu: string;
  readonly namaMenu: string;
  readonly tipeMenu: 'ITEM' | 'BUNDLE';
  readonly kodeKategori: 'PECEL' | 'MODEL' | 'MINUMAN' | 'ADDON' | 'SIDE';
  readonly namaKategori: string;
  readonly hargaJual: number;
  readonly sellingTime?: string;
  readonly bundleItems?: BundleComponent[];
}

/** Katalog resmi Warung Nafisah — satu-satunya menu yang diizinkan. */
const DEFAULT_MENUS: SeedMenu[] = [
  {
    _id: 'menu_mnm001',
    kodeMenu: 'MNM001',
    namaMenu: 'Es Teh',
    tipeMenu: 'ITEM',
    kodeKategori: 'MINUMAN',
    namaKategori: 'Minuman',
    hargaJual: 3_000,
  },
  {
    _id: 'menu_mdg001',
    kodeMenu: 'MDG001',
    namaMenu: 'Model Gandum',
    tipeMenu: 'ITEM',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 9_000,
    sellingTime: '07:00 - 14:00',
  },
  {
    _id: 'menu_aym001',
    kodeMenu: 'AYM001',
    namaMenu: 'Ayam',
    tipeMenu: 'ITEM',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 15_000,
    sellingTime: '07:00 - 14:00',
  },
  {
    _id: 'menu_ll001',
    kodeMenu: 'LL001',
    namaMenu: 'Lele',
    tipeMenu: 'ITEM',
    kodeKategori: 'PECEL',
    namaKategori: 'Pecel Lele',
    hargaJual: 11_000,
    sellingTime: '11:00 - 21:00',
  },
  {
    _id: 'menu_nas001',
    kodeMenu: 'NAS001',
    namaMenu: 'Nasi Putih',
    tipeMenu: 'ITEM',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 5_000,
  },
  {
    _id: 'menu_nas002',
    kodeMenu: 'NAS002',
    namaMenu: 'Nasi Uduk',
    tipeMenu: 'ITEM',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 6_000,
  },
  {
    _id: 'menu_syr001',
    kodeMenu: 'SYR001',
    namaMenu: 'Cah Kangkung',
    tipeMenu: 'ITEM',
    kodeKategori: 'SIDE',
    namaKategori: 'Sayuran',
    hargaJual: 10_000,
  },
  {
    _id: 'menu_pkt001',
    kodeMenu: 'PKT001',
    namaMenu: 'Lele + Nasi Putih',
    tipeMenu: 'BUNDLE',
    kodeKategori: 'PECEL',
    namaKategori: 'Pecel Lele',
    hargaJual: 15_000,
    bundleItems: [
      { kodeMenu: 'LL001', qty: 1 },
      { kodeMenu: 'NAS001', qty: 1 },
    ],
  },
  {
    _id: 'menu_pkt002',
    kodeMenu: 'PKT002',
    namaMenu: 'Lele + Nasi Uduk',
    tipeMenu: 'BUNDLE',
    kodeKategori: 'PECEL',
    namaKategori: 'Pecel Lele',
    hargaJual: 16_000,
    bundleItems: [
      { kodeMenu: 'LL001', qty: 1 },
      { kodeMenu: 'NAS002', qty: 1 },
    ],
  },
  {
    _id: 'menu_pkt003',
    kodeMenu: 'PKT003',
    namaMenu: 'Ayam + Nasi Putih',
    tipeMenu: 'BUNDLE',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 20_000,
    bundleItems: [
      { kodeMenu: 'AYM001', qty: 1 },
      { kodeMenu: 'NAS001', qty: 1 },
    ],
  },
  {
    _id: 'menu_pkt004',
    kodeMenu: 'PKT004',
    namaMenu: 'Ayam + Nasi Uduk',
    tipeMenu: 'BUNDLE',
    kodeKategori: 'MODEL',
    namaKategori: 'Model Gandum',
    hargaJual: 21_000,
    bundleItems: [
      { kodeMenu: 'AYM001', qty: 1 },
      { kodeMenu: 'NAS002', qty: 1 },
    ],
  },
  {
    _id: 'menu_mnm003',
    kodeMenu: 'MNM003',
    namaMenu: 'Srikaya',
    tipeMenu: 'ITEM',
    kodeKategori: 'MINUMAN',
    namaKategori: 'Minuman',
    hargaJual: 2_000,
  },
  {
    _id: 'menu_add001',
    kodeMenu: 'ADD001',
    namaMenu: 'Pempek Ikan',
    tipeMenu: 'ITEM',
    kodeKategori: 'ADDON',
    namaKategori: 'Add On',
    hargaJual: 1_000,
  },
];

const CATALOG_KODE_MENUS = DEFAULT_MENUS.map((menu) => menu.kodeMenu);

export async function seedPosData(): Promise<void> {
  await seedUsers();
  await seedMenus();
}

async function seedUsers(): Promise<void> {
  const model = getUserModel();
  const count = await model.countDocuments();
  if (count > 0) return;

  const now = new Date();
  const passwordHash = await bcrypt.hash('warung123', 10);

  await model.insertMany([
    {
      _id: 'user_owner',
      name: 'Owner Warung',
      email: 'owner@warungnafisah.local',
      passwordHash,
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'user_kasir',
      name: 'Kasir Warung',
      email: 'kasir@warungnafisah.local',
      passwordHash,
      role: 'kasir',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

async function seedMenus(): Promise<void> {
  const model = getMenuModel();
  const now = new Date();

  await model.deleteMany({ kodeMenu: { $nin: CATALOG_KODE_MENUS } });

  for (const menu of DEFAULT_MENUS) {
    await model.updateOne(
      { kodeMenu: menu.kodeMenu },
      {
        $set: {
          namaMenu: menu.namaMenu,
          tipeMenu: menu.tipeMenu,
          kodeKategori: menu.kodeKategori,
          namaKategori: menu.namaKategori,
          hargaJual: menu.hargaJual,
          sellingTime: menu.sellingTime,
          bundleItems: menu.bundleItems,
          status: 'available',
          updatedAt: now,
        },
        $setOnInsert: {
          _id: menu._id,
          kodeMenu: menu.kodeMenu,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }
}
