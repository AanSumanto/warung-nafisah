import type { LoyaltyLedgerEntry } from '../../domain/loyalty/LoyaltyLedgerEntry.js';
import type { ICustomerRepository } from '../../domain/loyalty/ICustomerRepository.js';
import type { ILoyaltyLedgerRepository } from '../../domain/loyalty/ILoyaltyLedgerRepository.js';
import { NotFoundException, ValidationException } from '../../core/exceptions/BaseException.js';
import { getCustomerModel } from '../../infrastructure/loyalty/documents/CustomerDocument.js';
import { getLoyaltyLedgerModel } from '../../infrastructure/loyalty/documents/LoyaltyLedgerDocument.js';
import { getOrderModel } from '../../infrastructure/pos/documents/OrderDocument.js';
import { tryNormalizePhoneId } from '../../domain/loyalty/phone.js';
import { isUrlSafePublicMemberId } from '../../domain/loyalty/publicMemberId.js';
import {
  resolveLoyaltyDateRange,
  safePercent,
  type LoyaltyDateRange,
} from './loyaltyDateRange.js';
import type { LoyaltyEarnService } from './LoyaltyEarnService.js';
import { createIdentifier } from '../../domain/common/Identifier.js';

export interface LoyaltyDashboardDTO {
  readonly range: {
    readonly from: string;
    readonly to: string;
    readonly preset: string;
    readonly timezone: string;
  };
  readonly definitions: Record<string, string>;
  readonly members: {
    readonly totalRegistered: number;
    readonly activeInRange: number;
    readonly negativeBalanceCount: number;
  };
  readonly points: {
    readonly earnedInRange: number;
    readonly redeemedInRange: number;
    readonly reversedInRange: number;
    readonly manualPositiveInRange: number;
    readonly manualNegativeInRange: number;
    readonly manualNetInRange: number;
    readonly redemptionRatePoints: number | null;
    readonly netOutstanding: number;
    readonly positiveOutstanding: number;
    readonly negativeDeficit: number;
  };
  readonly cost: {
    readonly rewardHppCostInRange: number;
    readonly eligibleMemberSalesInRange: number;
    readonly loyaltyCostPercent: number | null;
    readonly note: string;
  };
  readonly sales: {
    readonly memberOrderCount: number;
    readonly memberSalesAmount: number;
    readonly memberAov: number | null;
    readonly nonMemberOrderCount: number;
    readonly nonMemberSalesAmount: number;
    readonly nonMemberAov: number | null;
  };
  readonly repeat: {
    readonly activeMembers: number;
    readonly repeatMembers: number;
    readonly repeatRatePercent: number | null;
    readonly definition: string;
  };
  readonly topRewards: ReadonlyArray<{
    readonly rewardCode: string;
    readonly rewardName: string;
    readonly redemptionCount: number;
    readonly pointsSpent: number;
    readonly hppCost: number;
    readonly shareOfRedemptionsPercent: number | null;
  }>;
  readonly recentManualAdjustments: ReadonlyArray<{
    readonly occurredAt: string;
    readonly customerId: string;
    readonly pointsDelta: number;
    readonly reason: string;
    readonly actorUserId: string;
  }>;
  readonly limitations: readonly string[];
}

export interface AdminMemberSearchHit {
  readonly customerId: string;
  readonly name?: string;
  readonly phoneMasked: string;
  readonly currentPoints: number;
  readonly status: string;
}

export interface AdminMemberDetailDTO {
  readonly customerId: string;
  readonly publicMemberId: string;
  readonly name?: string;
  readonly phoneMasked: string;
  readonly phoneNormalized: string;
  readonly currentPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly lifetimeRedeemedPoints: number;
  readonly totalSpending: number;
  readonly totalSpendingLabel: string;
  readonly transactionCount: number;
  readonly transactionCountLabel: string;
  readonly registeredAt: string;
  readonly lastTransactionAt: string | null;
  readonly status: string;
  readonly redemptionSummary: {
    readonly redeemCount: number;
    readonly pointsRedeemed: number;
    readonly hppCost: number;
  };
  readonly manualAdjustmentCount: number;
}

export interface AdminLedgerItemDTO {
  readonly id: string;
  readonly type: string;
  readonly pointsDelta: number;
  readonly balanceAfter: number;
  readonly occurredAt: string;
  readonly summary: string;
  readonly actorUserId?: string;
  readonly reason?: string;
}

/**
 * Owner analytics — Mongo aggregations only (no full ledger load into Node).
 *
 * Metric formulas (documented + returned in DTO.definitions):
 * - TOTAL_POINTS_EARNED_IN_RANGE = sum(EARN_SALE.pointsDelta) where occurredAt in range
 * - TOTAL_POINTS_REDEEMED_IN_RANGE = abs(sum(REDEEM_REWARD.pointsDelta))
 * - TOTAL_POINTS_REVERSED_IN_RANGE = abs(sum(REVERSAL_REFUND + REVERSAL_VOID pointsDelta))
 * - NET_OUTSTANDING = sum(customer.currentPoints)
 * - POSITIVE_OUTSTANDING = sum(max(currentPoints,0))
 * - NEGATIVE_DEFICIT = abs(sum(min(currentPoints,0)))
 * - REWARD_HPP_COST = sum(metadata.rewardHppSnapshot) for REDEEM_REWARD in range
 * - ELIGIBLE_MEMBER_SALES = sum(EARN_SALE.metadata.eligiblePaidAmount) in range
 * - LOYALTY_COST_% = rewardHppCost / eligibleMemberSales * 100
 * - REDEMPTION_RATE_POINTS = pointsRedeemed / pointsEarned
 * - ACTIVE_MEMBER = distinct customerId on paid orders with customerId in range
 * - REPEAT_RATE = members with >=2 paid member orders / members with >=1
 */
export class LoyaltyAnalyticsService {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly ledger: ILoyaltyLedgerRepository,
    private readonly earnService: LoyaltyEarnService,
  ) {}

  async getDashboard(query: {
    readonly preset?: string;
    readonly from?: string;
    readonly to?: string;
  }): Promise<LoyaltyDashboardDTO> {
    let range: LoyaltyDateRange;
    try {
      range = resolveLoyaltyDateRange(query);
    } catch {
      throw new ValidationException('Rentang tanggal tidak valid', {
        code: 'LOYALTY_ANALYTICS_INVALID_RANGE',
      });
    }

    const from = range.from;
    const to = range.to;
    const ledgerModel = getLoyaltyLedgerModel();
    const customerModel = getCustomerModel();
    const orderModel = getOrderModel();

    const [
      memberStats,
      outstanding,
      pointByType,
      eligibleSalesAgg,
      rewardCostAgg,
      rewardBreakdown,
      salesSplit,
      repeatAgg,
      recentManual,
    ] = await Promise.all([
      customerModel.aggregate<{ total: number; negative: number }>([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            negative: {
              $sum: { $cond: [{ $lt: ['$currentPoints', 0] }, 1, 0] },
            },
          },
        },
      ]),
      customerModel.aggregate<{
        net: number;
        positive: number;
        deficit: number;
      }>([
        {
          $group: {
            _id: null,
            net: { $sum: '$currentPoints' },
            positive: {
              $sum: { $cond: [{ $gt: ['$currentPoints', 0] }, '$currentPoints', 0] },
            },
            deficit: {
              $sum: {
                $cond: [{ $lt: ['$currentPoints', 0] }, { $abs: '$currentPoints' }, 0],
              },
            },
          },
        },
      ]),
      ledgerModel.aggregate<{ _id: string; points: number; count: number }>([
        { $match: { occurredAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$type',
            points: { $sum: '$pointsDelta' },
            count: { $sum: 1 },
          },
        },
      ]),
      ledgerModel.aggregate<{ total: number }>([
        {
          $match: {
            type: 'EARN_SALE',
            occurredAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$metadata.eligiblePaidAmount', 0] } },
          },
        },
      ]),
      ledgerModel.aggregate<{ cost: number }>([
        {
          $match: {
            type: 'REDEEM_REWARD',
            occurredAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            cost: { $sum: { $ifNull: ['$metadata.rewardHppSnapshot', 0] } },
          },
        },
      ]),
      ledgerModel.aggregate<{
        _id: string;
        rewardName: string;
        count: number;
        pointsSpent: number;
        hppCost: number;
      }>([
        {
          $match: {
            type: 'REDEEM_REWARD',
            occurredAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: '$metadata.rewardCode',
            rewardName: { $last: '$metadata.rewardName' },
            count: { $sum: 1 },
            pointsSpent: { $sum: { $abs: '$pointsDelta' } },
            hppCost: { $sum: { $ifNull: ['$metadata.rewardHppSnapshot', 0] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      orderModel.aggregate<{
        _id: string;
        count: number;
        amount: number;
      }>([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $trim: { input: { $ifNull: ['$customerId', ''] } },
                      },
                    },
                    0,
                  ],
                },
                'member',
                'nonmember',
              ],
            },
            count: { $sum: 1 },
            amount: { $sum: '$total' },
          },
        },
      ]),
      orderModel.aggregate<{
        active: number;
        repeat: number;
      }>([
        {
          $match: {
            status: 'paid',
            paidAt: { $gte: from, $lte: to },
            customerId: { $exists: true, $nin: [null, ''] },
          },
        },
        {
          $group: {
            _id: '$customerId',
            txCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            active: { $sum: 1 },
            repeat: {
              $sum: { $cond: [{ $gte: ['$txCount', 2] }, 1, 0] },
            },
          },
        },
      ]),
      ledgerModel
        .find({ type: 'MANUAL_ADJUSTMENT', occurredAt: { $gte: from, $lte: to } })
        .sort({ occurredAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const typeMap = new Map(pointByType.map((r) => [r._id, r.points]));
    const earned = Math.max(0, typeMap.get('EARN_SALE') ?? 0);
    const redeemed = Math.abs(Math.min(0, typeMap.get('REDEEM_REWARD') ?? 0));
    const reversed =
      Math.abs(Math.min(0, typeMap.get('REVERSAL_REFUND') ?? 0)) +
      Math.abs(Math.min(0, typeMap.get('REVERSAL_VOID') ?? 0));
    const manualNet = typeMap.get('MANUAL_ADJUSTMENT') ?? 0;
    const manualPosAgg = await ledgerModel.aggregate<{ pos: number; neg: number }>([
      {
        $match: {
          type: 'MANUAL_ADJUSTMENT',
          occurredAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          pos: {
            $sum: { $cond: [{ $gt: ['$pointsDelta', 0] }, '$pointsDelta', 0] },
          },
          neg: {
            $sum: {
              $cond: [{ $lt: ['$pointsDelta', 0] }, { $abs: '$pointsDelta' }, 0],
            },
          },
        },
      },
    ]);

    const memberSales = salesSplit.find((s) => s._id === 'member');
    const nonMemberSales = salesSplit.find((s) => s._id === 'nonmember');
    const memberCount = memberSales?.count ?? 0;
    const memberAmount = memberSales?.amount ?? 0;
    const nonMemberCount = nonMemberSales?.count ?? 0;
    const nonMemberAmount = nonMemberSales?.amount ?? 0;

    const rewardHppCost = rewardCostAgg[0]?.cost ?? 0;
    const eligibleMemberSales = eligibleSalesAgg[0]?.total ?? 0;
    const totalRedemptions = rewardBreakdown.reduce((s, r) => s + r.count, 0);
    const activeMembers = repeatAgg[0]?.active ?? 0;
    const repeatMembers = repeatAgg[0]?.repeat ?? 0;

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
        preset: range.preset,
        timezone: range.timezone,
      },
      definitions: {
        TOTAL_POINTS_EARNED_IN_RANGE: 'sum(EARN_SALE.pointsDelta) in range',
        TOTAL_POINTS_REDEEMED_IN_RANGE: 'abs(sum(REDEEM_REWARD.pointsDelta)) in range',
        TOTAL_POINTS_REVERSED_IN_RANGE:
          'abs(sum(REVERSAL_REFUND + REVERSAL_VOID pointsDelta)) in range',
        NET_OUTSTANDING: 'sum(customer.currentPoints) all-time snapshot',
        POSITIVE_OUTSTANDING: 'sum(max(currentPoints,0))',
        NEGATIVE_DEFICIT: 'abs(sum(min(currentPoints,0)))',
        REWARD_HPP_COST: 'sum(REDEEM_REWARD.metadata.rewardHppSnapshot) in range',
        ELIGIBLE_MEMBER_SALES:
          'sum(EARN_SALE.metadata.eligiblePaidAmount) in range (recorded eligible spending)',
        LOYALTY_COST_PERCENT: 'rewardHppCost / eligibleMemberSales * 100',
        REDEMPTION_RATE_POINTS: 'pointsRedeemed / pointsEarned in range',
        ACTIVE_MEMBER:
          'distinct customerId on paid orders with customerId attached in range',
        REPEAT_RATE: 'members with >=2 paid member orders / active members in range',
      },
      members: {
        totalRegistered: memberStats[0]?.total ?? 0,
        activeInRange: activeMembers,
        negativeBalanceCount: memberStats[0]?.negative ?? 0,
      },
      points: {
        earnedInRange: earned,
        redeemedInRange: redeemed,
        reversedInRange: reversed,
        manualPositiveInRange: manualPosAgg[0]?.pos ?? 0,
        manualNegativeInRange: manualPosAgg[0]?.neg ?? 0,
        manualNetInRange: manualNet,
        redemptionRatePoints: safePercent(redeemed, earned),
        netOutstanding: outstanding[0]?.net ?? 0,
        positiveOutstanding: outstanding[0]?.positive ?? 0,
        negativeDeficit: outstanding[0]?.deficit ?? 0,
      },
      cost: {
        rewardHppCostInRange: rewardHppCost,
        eligibleMemberSalesInRange: eligibleMemberSales,
        loyaltyCostPercent: safePercent(rewardHppCost, eligibleMemberSales),
        note: 'Loyalty cost uses historical reward HPP snapshots ÷ recorded eligible member sales from EARN_SALE — not full restaurant omzet. Not a financial accounting liability valuation.',
      },
      sales: {
        memberOrderCount: memberCount,
        memberSalesAmount: memberAmount,
        memberAov: memberCount > 0 ? Math.round(memberAmount / memberCount) : null,
        nonMemberOrderCount: nonMemberCount,
        nonMemberSalesAmount: nonMemberAmount,
        nonMemberAov: nonMemberCount > 0 ? Math.round(nonMemberAmount / nonMemberCount) : null,
      },
      repeat: {
        activeMembers,
        repeatMembers,
        repeatRatePercent: safePercent(repeatMembers, activeMembers),
        definition:
          'members with >=2 completed paid member transactions in range / members with >=1',
      },
      topRewards: rewardBreakdown.map((r) => ({
        rewardCode: String(r._id ?? ''),
        rewardName: String(r.rewardName ?? r._id ?? ''),
        redemptionCount: r.count,
        pointsSpent: r.pointsSpent,
        hppCost: r.hppCost,
        shareOfRedemptionsPercent: safePercent(r.count, totalRedemptions),
      })),
      recentManualAdjustments: recentManual.map((doc) => {
        const meta = (doc.metadata ?? {}) as Record<string, unknown>;
        return {
          occurredAt: new Date(doc.occurredAt).toISOString(),
          customerId: String(doc.customerId),
          pointsDelta: doc.pointsDelta,
          reason: String(meta.reason ?? ''),
          actorUserId: String(doc.actor?.userId ?? ''),
        };
      }),
      limitations: [
        'Operational paid refund/void does not exist — reversal metrics reflect ledger foundation / tests only',
        'totalSpending / transactionCount are not refund-adjusted',
        'Outstanding points are point counts, not Rp liability',
        'POINT_EXPIRY not implemented',
      ],
    };
  }

  async searchMembers(q: string): Promise<AdminMemberSearchHit[]> {
    const raw = q.trim();
    if (!raw || raw.length < 2) {
      throw new ValidationException('Query minimal 2 karakter', {
        code: 'LOYALTY_ADMIN_SEARCH_INVALID',
      });
    }
    const model = getCustomerModel();
    const or: Record<string, unknown>[] = [];

    if (isUrlSafePublicMemberId(raw)) {
      or.push({ publicMemberId: raw });
    }
    const phone = tryNormalizePhoneId(raw);
    if (phone) {
      or.push({ phoneNormalized: phone });
    }
    // name prefix (case-insensitive)
    or.push({ name: { $regex: `^${escapeRegex(raw)}`, $options: 'i' } });
    // masked phone fragment
    if (/^\d{3,}$/.test(raw.replace(/\D/g, ''))) {
      or.push({ phoneMasked: { $regex: escapeRegex(raw.replace(/\D/g, '').slice(-4)) } });
    }

    const docs = await model
      .find({ $or: or })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return docs.map((d) => ({
      customerId: String(d._id),
      name: d.name ? String(d.name) : undefined,
      phoneMasked: String(d.phoneMasked),
      currentPoints: d.currentPoints,
      status: String(d.status),
    }));
  }

  async getMemberDetail(customerId: string): Promise<AdminMemberDetailDTO> {
    const customer = await this.customers.findById(createIdentifier(customerId));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }

    const ledgerModel = getLoyaltyLedgerModel();
    const [redeemAgg, manualCount] = await Promise.all([
      ledgerModel.aggregate<{
        count: number;
        points: number;
        cost: number;
      }>([
        { $match: { customerId: String(customer.id), type: 'REDEEM_REWARD' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            points: { $sum: { $abs: '$pointsDelta' } },
            cost: { $sum: { $ifNull: ['$metadata.rewardHppSnapshot', 0] } },
          },
        },
      ]),
      ledgerModel.countDocuments({
        customerId: String(customer.id),
        type: 'MANUAL_ADJUSTMENT',
      }),
    ]);

    return {
      customerId: String(customer.id),
      publicMemberId: customer.publicMemberId,
      name: customer.name,
      phoneMasked: customer.phoneMasked,
      phoneNormalized: customer.phoneNormalized,
      currentPoints: customer.currentPoints,
      lifetimeEarnedPoints: customer.lifetimeEarnedPoints,
      lifetimeRedeemedPoints: customer.lifetimeRedeemedPoints,
      totalSpending: customer.totalSpending,
      totalSpendingLabel: 'Recorded eligible spending (not net after refunds)',
      transactionCount: customer.transactionCount,
      transactionCountLabel: 'Completed earn-linked purchase count (not refund-adjusted)',
      registeredAt: customer.registeredAt.toISOString(),
      lastTransactionAt: customer.lastTransactionAt
        ? customer.lastTransactionAt.toISOString()
        : null,
      status: customer.status,
      redemptionSummary: {
        redeemCount: redeemAgg[0]?.count ?? 0,
        pointsRedeemed: redeemAgg[0]?.points ?? 0,
        hppCost: redeemAgg[0]?.cost ?? 0,
      },
      manualAdjustmentCount: manualCount,
    };
  }

  async getMemberLedger(
    customerId: string,
    query: { readonly limit?: number; readonly cursor?: string; readonly type?: string },
  ): Promise<{
    readonly items: AdminLedgerItemDTO[];
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  }> {
    const customer = await this.customers.findById(createIdentifier(customerId));
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan');
    }

    const limit = Math.min(Math.max(1, query.limit ?? 20), 50);
    let beforeOccurredAt: Date | undefined;
    let beforeId: string | undefined;
    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8'),
        ) as { o: string; i: string };
        beforeOccurredAt = new Date(decoded.o);
        beforeId = decoded.i;
      } catch {
        throw new ValidationException('Cursor tidak valid', {
          code: 'LOYALTY_ADMIN_LEDGER_CURSOR_INVALID',
        });
      }
    }

    const page = await this.ledger.listPageByCustomer({
      customerId: String(customer.id),
      limit,
      beforeOccurredAt,
      beforeId,
      type: query.type,
    });
    const hasMore = page.length > limit;
    const slice = hasMore ? page.slice(0, limit) : page;
    const items = slice.map((e) => this.toAdminLedgerItem(e));
    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({ o: last.occurredAt.toISOString(), i: last.id }),
          ).toString('base64url')
        : null;

    return { items, nextCursor, hasMore };
  }

  async verifyBalance(customerId: string): Promise<{
    readonly status: 'MATCH' | 'MISMATCH';
    readonly cachedPoints: number;
    readonly ledgerSum: number;
  }> {
    const result = await this.earnService.reconcileBalance(customerId);
    return {
      status: result.matches ? 'MATCH' : 'MISMATCH',
      cachedPoints: result.cachedPoints,
      ledgerSum: result.ledgerSum,
    };
  }

  private toAdminLedgerItem(entry: LoyaltyLedgerEntry): AdminLedgerItemDTO {
    let summary = String(entry.type);
    let reason: string | undefined;
    const meta = entry.metadata;
    if (meta.kind === 'MANUAL_ADJUSTMENT') {
      summary = 'Penyesuaian manual';
      reason = meta.reason;
    } else if (meta.kind === 'REDEEM_REWARD') {
      summary = `Tukar ${meta.rewardName}`;
    } else if (meta.kind === 'EARN_SALE') {
      summary = 'Earn penjualan';
    } else if (meta.kind === 'REVERSAL_REFUND') {
      summary = 'Reversal refund';
    } else if (meta.kind === 'REVERSAL_VOID') {
      summary = 'Reversal void';
    }

    return {
      id: entry.id,
      type: entry.type,
      pointsDelta: entry.pointsDelta,
      balanceAfter: entry.balanceAfter,
      occurredAt: entry.occurredAt.toISOString(),
      summary,
      actorUserId: entry.actor.userId,
      reason,
    };
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
