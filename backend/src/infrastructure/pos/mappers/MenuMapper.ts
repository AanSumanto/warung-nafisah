import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import { Menu } from '../../../domain/pos/Menu.js';
import type { MenuDocument } from '../documents/MenuDocument.js';

export class MenuMapper extends BaseMongoMapper<Menu, MenuDocument> {
  toDocument(entity: Menu): MenuDocument {
    return {
      _id: entity.id,
      kodeMenu: entity.kodeMenu,
      namaMenu: entity.namaMenu,
      tipeMenu: entity.tipeMenu,
      kodeKategori: entity.kodeKategori,
      namaKategori: entity.namaKategori,
      hargaJual: entity.hargaJual,
      status: entity.status,
      sellingTime: entity.sellingTime,
      bundleItems: entity.bundleItems ? [...entity.bundleItems] : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: MenuDocument): Menu {
    return Menu.reconstitute(
      document._id,
      {
        kodeMenu: document.kodeMenu,
        namaMenu: document.namaMenu,
        tipeMenu: document.tipeMenu,
        kodeKategori: document.kodeKategori,
        namaKategori: document.namaKategori,
        hargaJual: document.hargaJual,
        status: document.status,
        sellingTime: document.sellingTime,
        bundleItems: document.bundleItems,
      },
      document.createdAt,
      document.updatedAt,
    );
  }
}
