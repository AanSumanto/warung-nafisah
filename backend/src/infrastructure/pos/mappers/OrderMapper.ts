import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import { Order } from '../../../domain/pos/Order.js';
import { OrderItem } from '../../../domain/pos/OrderItem.js';
import type { OrderDocument } from '../documents/OrderDocument.js';

export class OrderMapper extends BaseMongoMapper<Order, OrderDocument> {
  toDocument(entity: Order): OrderDocument {
    const record = entity.toRecord();
    return {
      _id: entity.id,
      orderNumber: record.orderNumber,
      status: record.status,
      diningType: record.diningType,
      cashierId: record.cashierId,
      cashierName: record.cashierName,
      shiftId: record.shiftId,
      items: record.items.map((item) => ({
        _id: item.id,
        kodeMenu: item.kodeMenu,
        namaMenu: item.namaMenu,
        kodeKategori: item.kodeKategori,
        namaKategori: item.namaKategori,
        tipeMenu: item.tipeMenu,
        hargaJual: item.hargaJual,
        qty: item.qty,
        subtotal: item.subtotal,
        note: item.note,
      })),
      total: entity.total,
      paymentMethod: record.paymentMethod,
      paidAmount: record.paidAmount,
      changeAmount: record.changeAmount,
      paidAt: record.paidAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: OrderDocument): Order {
    return Order.reconstitute(
      document._id,
      {
        orderNumber: document.orderNumber,
        status: document.status,
        diningType: document.diningType,
        cashierId: document.cashierId,
        cashierName: document.cashierName,
        shiftId: document.shiftId,
        items: document.items.map(
          (item) =>
            new OrderItem(item._id, {
              kodeMenu: item.kodeMenu,
              namaMenu: item.namaMenu,
              kodeKategori: item.kodeKategori,
              namaKategori: item.namaKategori,
              tipeMenu: item.tipeMenu,
              hargaJual: item.hargaJual,
              qty: item.qty,
              subtotal: item.subtotal,
              note: item.note,
            }),
        ),
        paymentMethod: document.paymentMethod,
        paidAmount: document.paidAmount,
        changeAmount: document.changeAmount,
        paidAt: document.paidAt,
      },
      document.createdAt,
      document.updatedAt,
    );
  }
}
