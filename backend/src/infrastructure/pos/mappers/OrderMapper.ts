import { BaseMongoMapper } from '../../persistence/mappers/MongoMapper.js';
import { normalizeMongoId } from '../../persistence/normalizeMongoId.js';
import { Order } from '../../../domain/pos/Order.js';
import { OrderItem } from '../../../domain/pos/OrderItem.js';
import type { OrderLineKind } from '../../../domain/pos/OrderItem.js';
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
        lineKind: item.lineKind,
        rewardCode: item.rewardCode,
        rewardHppSnapshot: item.rewardHppSnapshot,
        pointsUsed: item.pointsUsed,
      })),
      total: entity.total,
      paymentMethod: record.paymentMethod,
      paidAmount: record.paidAmount,
      changeAmount: record.changeAmount,
      paidAt: record.paidAt,
      customerId: record.customerId ?? null,
      customerSnapshot: record.customerSnapshot
        ? {
            customerId: record.customerSnapshot.customerId,
            phoneMasked: record.customerSnapshot.phoneMasked,
            name: record.customerSnapshot.name,
          }
        : null,
      loyaltyReceipt: record.loyaltyReceipt
        ? {
            awarded: true as const,
            pointsEarned: record.loyaltyReceipt.pointsEarned,
            balanceAfter: record.loyaltyReceipt.balanceAfter,
            eligiblePaidAmount: record.loyaltyReceipt.eligiblePaidAmount,
            programVersion: record.loyaltyReceipt.programVersion,
            pointEarnRate: record.loyaltyReceipt.pointEarnRate,
            ledgerEntryId: record.loyaltyReceipt.ledgerEntryId,
            phoneMasked: record.loyaltyReceipt.phoneMasked,
            name: record.loyaltyReceipt.name,
            publicMemberId: record.loyaltyReceipt.publicMemberId,
            progressMessage: record.loyaltyReceipt.progressMessage,
            memberPortalUrl: record.loyaltyReceipt.memberPortalUrl,
            nextRewardName: record.loyaltyReceipt.nextRewardName,
            nextRewardPointsRemaining: record.loyaltyReceipt.nextRewardPointsRemaining,
            redemption: record.loyaltyReceipt.redemption
              ? { ...record.loyaltyReceipt.redemption }
              : undefined,
          }
        : null,
      loyaltyRedemptionIntent: record.loyaltyRedemptionIntent
        ? { ...record.loyaltyRedemptionIntent }
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(document: OrderDocument): Order {
    return Order.reconstitute(
      this.documentId(document),
      {
        orderNumber: document.orderNumber,
        status: document.status,
        diningType: document.diningType,
        cashierId: document.cashierId,
        cashierName: document.cashierName,
        shiftId: document.shiftId,
        items: document.items.map(
          (item) =>
            new OrderItem(normalizeMongoId(item._id), {
              kodeMenu: item.kodeMenu,
              namaMenu: item.namaMenu,
              kodeKategori: item.kodeKategori,
              namaKategori: item.namaKategori,
              tipeMenu: item.tipeMenu,
              hargaJual: item.hargaJual,
              qty: item.qty,
              subtotal: item.subtotal,
              note: item.note,
              lineKind: (item.lineKind as OrderLineKind | undefined) ?? 'PAID',
              rewardCode: item.rewardCode,
              rewardHppSnapshot: item.rewardHppSnapshot,
              pointsUsed: item.pointsUsed,
            }),
        ),
        paymentMethod: document.paymentMethod,
        paidAmount: document.paidAmount,
        changeAmount: document.changeAmount,
        paidAt: document.paidAt,
        customerId: document.customerId ?? undefined,
        customerSnapshot: document.customerSnapshot
          ? {
              customerId: document.customerSnapshot.customerId,
              phoneMasked: document.customerSnapshot.phoneMasked,
              name: document.customerSnapshot.name,
            }
          : undefined,
        loyaltyReceipt: document.loyaltyReceipt
          ? {
              awarded: true,
              pointsEarned: document.loyaltyReceipt.pointsEarned,
              balanceAfter: document.loyaltyReceipt.balanceAfter,
              eligiblePaidAmount: document.loyaltyReceipt.eligiblePaidAmount,
              programVersion: document.loyaltyReceipt.programVersion,
              pointEarnRate: document.loyaltyReceipt.pointEarnRate,
              ledgerEntryId: document.loyaltyReceipt.ledgerEntryId,
              phoneMasked: document.loyaltyReceipt.phoneMasked,
              name: document.loyaltyReceipt.name,
              publicMemberId: document.loyaltyReceipt.publicMemberId,
              progressMessage: document.loyaltyReceipt.progressMessage,
              memberPortalUrl: document.loyaltyReceipt.memberPortalUrl,
              nextRewardName: document.loyaltyReceipt.nextRewardName,
              nextRewardPointsRemaining: document.loyaltyReceipt.nextRewardPointsRemaining,
              redemption: document.loyaltyReceipt.redemption
                ? { ...document.loyaltyReceipt.redemption }
                : undefined,
            }
          : undefined,
        loyaltyRedemptionIntent: document.loyaltyRedemptionIntent
          ? {
              rewardCode: document.loyaltyRedemptionIntent.rewardCode,
              customerId: document.loyaltyRedemptionIntent.customerId,
              selectedAt: document.loyaltyRedemptionIntent.selectedAt,
              selectedBy: document.loyaltyRedemptionIntent.selectedBy,
            }
          : undefined,
      },
      document.createdAt,
      document.updatedAt,
    );
  }
}
