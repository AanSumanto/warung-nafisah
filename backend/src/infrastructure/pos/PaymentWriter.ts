import type { ClientSession } from 'mongoose';
import { OrderItem } from '../../domain/pos/OrderItem.js';
import type { Order } from '../../domain/pos/Order.js';
import type { PaymentMethod } from '../../domain/pos/PosTypes.js';
import { getOrderItemModel } from './documents/OrderItemDocument.js';
import { getPaymentModel } from './documents/OrderItemDocument.js';

export class PaymentWriter {
  async persistPaidOrder(
    order: Order,
    paymentMethod: PaymentMethod,
    session?: ClientSession | null,
  ): Promise<void> {
    const now = new Date();
    const orderId = order.id;
    const paidAt = order.paidAt ?? now;

    await getOrderItemModel().deleteMany({ orderId }, { session: session ?? undefined });

    const itemDocs = order.items.map((item: OrderItem) => ({
      _id: `${orderId}_${item.id}`,
      orderId,
      kodeMenu: item.kodeMenu,
      namaMenu: item.namaMenu,
      kodeKategori: item.kodeKategori,
      namaKategori: item.namaKategori,
      tipeMenu: item.tipeMenu,
      hargaJual: item.hargaJual,
      qty: item.qty,
      subtotal: item.subtotal,
      note: item.note,
      createdAt: now,
      updatedAt: now,
    }));

    if (itemDocs.length > 0) {
      await getOrderItemModel().insertMany(itemDocs, { session: session ?? undefined });
    }

    await getPaymentModel().create(
      [
        {
          _id: `pay_${orderId}`,
          orderId,
          orderNumber: order.orderNumber,
          method: paymentMethod,
          amount: order.total,
          paidAmount: order.paidAmount ?? order.total,
          changeAmount: order.changeAmount ?? 0,
          cashierId: order.cashierId,
          paidAt,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { session: session ?? undefined },
    );
  }
}
