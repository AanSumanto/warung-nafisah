import { getMenuModel } from '../pos/documents/MenuDocument.js';
import type { IMenuReferenceLookup, MenuReference } from '../../application/loyalty/IMenuReferenceLookup.js';

function toMenuReference(doc: {
  kodeMenu: string;
  namaMenu: string;
  status: string;
  hargaJual: number;
}): MenuReference {
  return {
    kodeMenu: doc.kodeMenu,
    namaMenu: doc.namaMenu,
    status: doc.status,
    hargaJual: doc.hargaJual,
  };
}

export class MongoMenuReferenceLookup implements IMenuReferenceLookup {
  async findByKodeMenu(kodeMenu: string): Promise<MenuReference | null> {
    const normalized = kodeMenu.trim().toUpperCase();
    const doc = await getMenuModel().findOne({ kodeMenu: normalized }).lean();
    if (!doc) return null;
    return toMenuReference(doc);
  }

  async findByKodeMenus(kodeMenus: readonly string[]): Promise<Map<string, MenuReference>> {
    const normalized = [
      ...new Set(kodeMenus.map((k) => k.trim().toUpperCase()).filter(Boolean)),
    ];
    const map = new Map<string, MenuReference>();
    if (normalized.length === 0) return map;

    const docs = await getMenuModel()
      .find({ kodeMenu: { $in: normalized } })
      .lean();
    for (const doc of docs) {
      map.set(doc.kodeMenu, toMenuReference(doc));
    }
    return map;
  }
}
