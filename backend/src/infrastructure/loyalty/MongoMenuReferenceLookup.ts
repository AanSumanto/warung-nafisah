import { getMenuModel } from '../pos/documents/MenuDocument.js';
import type { IMenuReferenceLookup, MenuReference } from '../../application/loyalty/IMenuReferenceLookup.js';

export class MongoMenuReferenceLookup implements IMenuReferenceLookup {
  async findByKodeMenu(kodeMenu: string): Promise<MenuReference | null> {
    const normalized = kodeMenu.trim().toUpperCase();
    const doc = await getMenuModel().findOne({ kodeMenu: normalized }).lean();
    if (!doc) return null;
    return {
      kodeMenu: doc.kodeMenu,
      namaMenu: doc.namaMenu,
      status: doc.status,
      hargaJual: doc.hargaJual,
    };
  }
}
