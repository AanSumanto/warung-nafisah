import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getEnv } from '../../../config/env.js';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { ValidationException } from '../../../core/exceptions/BaseException.js';
import type { PosService } from '../../../application/pos/PosService.js';
import { MENU_CATEGORY_CODES, MENU_TYPES } from '../../../domain/pos/PosTypes.js';
import type { AuthService } from '../../../infrastructure/auth/AuthService.js';
import { createAuthMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

const createOrderSchema = z.object({
  diningType: z.enum(['dine_in', 'take_away']),
});

const updateItemsSchema = z.object({
  items: z
    .array(
      z.object({
        kodeMenu: z.string().min(1).max(32),
        qty: z.number().int().positive().max(999),
        note: z.string().max(200).optional(),
      }),
    )
    .max(100),
});

const payOrderSchema = z.object({
  paymentMethod: z.enum(['cash', 'qris', 'transfer']),
  paidAmount: z.number().int().nonnegative().optional(),
});

const attachCustomerSchema = z.object({
  customerId: z.string().trim().min(1).max(64),
});

const setRewardSchema = z.object({
  rewardCode: z.string().trim().min(3).max(48),
});

const openShiftSchema = z.object({
  openingCash: z.number().int().nonnegative(),
});

const closeShiftSchema = z.object({
  closingCash: z.number().int().nonnegative(),
});

const updateMenuPriceSchema = z.object({
  hargaJual: z.number().int().positive().max(100_000_000),
});

const createMenuSchema = z.object({
  kodeMenu: z.string().trim().min(1).max(32),
  namaMenu: z.string().trim().min(1).max(120),
  kodeKategori: z.enum(MENU_CATEGORY_CODES),
  hargaJual: z.number().int().positive().max(100_000_000),
  tipeMenu: z.enum(MENU_TYPES).optional(),
  sellingTime: z.string().trim().max(50).optional(),
});

const dashboardMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'AUTH_429',
      message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
    },
  },
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

function mapLoyaltyFromReceipt(order: Awaited<ReturnType<PosService['getOrder']>>) {
  const receipt = order.loyaltyReceipt;
  if (!receipt) return undefined;
  return {
    memberAttached: true,
    awarded: true as const,
    phoneMasked: receipt.phoneMasked,
    name: receipt.name,
    publicMemberId: receipt.publicMemberId,
    pointsEarned: receipt.pointsEarned,
    balanceAfter: receipt.balanceAfter,
    eligiblePaidAmount: receipt.eligiblePaidAmount,
    programVersion: receipt.programVersion,
    pointEarnRate: receipt.pointEarnRate,
    ledgerEntryId: receipt.ledgerEntryId,
    memberPortalUrl: receipt.memberPortalUrl,
    receiptProgress: {
      eligibleRewardCount: 0,
      hasRedeemableThreshold: true,
      progressMessage: receipt.progressMessage,
      nextReward:
        receipt.nextRewardName !== undefined && receipt.nextRewardPointsRemaining !== undefined
          ? {
              rewardCode: '',
              name: receipt.nextRewardName,
              pointsRequired: receipt.balanceAfter + receipt.nextRewardPointsRemaining,
              pointsRemaining: receipt.nextRewardPointsRemaining,
            }
          : undefined,
    },
    redemption: receipt.redemption
      ? {
          rewardCode: receipt.redemption.rewardCode,
          rewardName: receipt.redemption.rewardName,
          menuKode: receipt.redemption.menuKode,
          pointsUsed: receipt.redemption.pointsUsed,
          rewardHppSnapshot: receipt.redemption.rewardHppSnapshot,
          ledgerEntryId: receipt.redemption.ledgerEntryId,
          balanceAfter: receipt.redemption.balanceAfter,
        }
      : undefined,
  };
}

function mapOrder(order: Awaited<ReturnType<PosService['getOrder']>>) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    diningType: order.diningType,
    cashierId: order.cashierId,
    cashierName: order.cashierName,
    shiftId: order.shiftId,
    items: order.items.map((item) => item.toJSON()),
    total: order.total,
    paymentMethod: order.paymentMethod,
    paidAmount: order.paidAmount,
    changeAmount: order.changeAmount,
    paidAt: order.paidAt?.toISOString(),
    customerId: order.customerId,
    customerSnapshot: order.customerSnapshot
      ? {
          customerId: order.customerSnapshot.customerId,
          phoneMasked: order.customerSnapshot.phoneMasked,
          name: order.customerSnapshot.name,
        }
      : undefined,
    loyaltyRedemptionIntent: order.loyaltyRedemptionIntent
      ? {
          rewardCode: order.loyaltyRedemptionIntent.rewardCode,
          customerId: order.loyaltyRedemptionIntent.customerId,
          selectedAt: order.loyaltyRedemptionIntent.selectedAt.toISOString(),
          selectedBy: order.loyaltyRedemptionIntent.selectedBy,
        }
      : undefined,
    loyalty: mapLoyaltyFromReceipt(order),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function mapMenu(menu: Awaited<ReturnType<PosService['listMenus']>>[number]) {
  return {
    id: menu.id,
    kodeMenu: menu.kodeMenu,
    namaMenu: menu.namaMenu,
    tipeMenu: menu.tipeMenu,
    kodeKategori: menu.kodeKategori,
    namaKategori: menu.namaKategori,
    hargaJual: menu.hargaJual,
    status: menu.status,
    sellingTime: menu.sellingTime,
    bundleItems: menu.bundleItems,
  };
}

export function createPosRouter(posService: PosService, authService: AuthService): Router {
  const router = Router();
  const auth = createAuthMiddleware(authService);

  router.post('/auth/login', loginRateLimit, async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data login tidak valid');
      const result = await authService.login(parsed.data.email, parsed.data.password);
      return ResponseWrapper.success(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/change-password', auth, async (req, res, next) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data password tidak valid');
      await authService.changePassword(
        req.user!.sub,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      return ResponseWrapper.success(res, { changed: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/menus', auth, async (_req, res, next) => {
    try {
      const menus = await posService.listMenus();
      return ResponseWrapper.success(res, menus.map(mapMenu));
    } catch (error) {
      next(error);
    }
  });

  router.get('/menus/manage', auth, requireRole('owner'), async (_req, res, next) => {
    try {
      const menus = await posService.listMenusForManagement();
      return ResponseWrapper.success(res, menus.map(mapMenu));
    } catch (error) {
      next(error);
    }
  });

  router.post('/menus', auth, requireRole('owner'), async (req, res, next) => {
    try {
      const parsed = createMenuSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data menu tidak valid');
      const menu = await posService.createMenu(parsed.data);
      return ResponseWrapper.success(res, mapMenu(menu), 201);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/menus/:kodeMenu', auth, requireRole('owner'), async (req, res, next) => {
    try {
      const parsed = updateMenuPriceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Harga jual tidak valid');
      const menu = await posService.updateMenuHarga(param(req.params.kodeMenu), parsed.data.hargaJual);
      return ResponseWrapper.success(res, mapMenu(menu));
    } catch (error) {
      next(error);
    }
  });

  router.post('/orders', auth, async (req, res, next) => {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data order tidak valid');
      const user = req.user!;
      const shift = await posService.getOpenShift(user.sub);
      const order = await posService.createDraftOrder({
        diningType: parsed.data.diningType,
        cashierId: user.sub,
        cashierName: user.name,
        shiftId: shift?.id,
        correlationId: req.context?.correlationId,
      });
      return ResponseWrapper.success(res, mapOrder(order), 201);
    } catch (error) {
      next(error);
    }
  });

  router.put('/orders/:orderId/items', auth, async (req, res, next) => {
    try {
      const parsed = updateItemsSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data item tidak valid');
      const order = await posService.updateOrderItems(
        param(req.params.orderId),
        parsed.data.items,
        req.user!,
      );
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.put('/orders/:orderId/customer', auth, async (req, res, next) => {
    try {
      const parsed = attachCustomerSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('customerId tidak valid');
      const order = await posService.attachOrderCustomer(
        param(req.params.orderId),
        parsed.data.customerId,
        req.user!,
      );
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/orders/:orderId/customer', auth, async (req, res, next) => {
    try {
      const order = await posService.clearOrderCustomer(param(req.params.orderId), req.user!);
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:orderId/rewards', auth, async (req, res, next) => {
    try {
      const data = await posService.listOrderRewards(param(req.params.orderId), req.user!);
      return ResponseWrapper.success(res, data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/loyalty/member-rewards/:customerId', auth, async (req, res, next) => {
    try {
      const data = await posService.listMemberRewards(param(req.params.customerId), req.user!);
      return ResponseWrapper.success(res, data);
    } catch (error) {
      next(error);
    }
  });

  router.put('/orders/:orderId/reward', auth, async (req, res, next) => {
    try {
      const parsed = setRewardSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('rewardCode tidak valid');
      const order = await posService.setOrderReward(
        param(req.params.orderId),
        parsed.data.rewardCode,
        req.user!,
      );
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/orders/:orderId/reward', auth, async (req, res, next) => {
    try {
      const order = await posService.clearOrderReward(param(req.params.orderId), req.user!);
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.post('/orders/:orderId/pay', auth, async (req, res, next) => {
    try {
      const parsed = payOrderSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data pembayaran tidak valid');
      const result = await posService.payOrder({
        orderId: param(req.params.orderId),
        paymentMethod: parsed.data.paymentMethod,
        paidAmount: parsed.data.paidAmount,
        correlationId: req.context?.correlationId,
        requester: req.user!,
      });
      return ResponseWrapper.success(res, {
        ...mapOrder(result.order),
        loyalty: result.loyalty,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/today', auth, async (req, res, next) => {
    try {
      const orders = await posService.listTodayOrders(req.user!);
      return ResponseWrapper.success(res, orders.map(mapOrder));
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:orderId', auth, async (req, res, next) => {
    try {
      const order = await posService.getOrder(param(req.params.orderId), req.user!);
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.post('/shifts/open', auth, async (req, res, next) => {
    try {
      const parsed = openShiftSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data shift tidak valid');
      const user = req.user!;
      const shift = await posService.openShift(user.sub, user.name, parsed.data.openingCash);
      return ResponseWrapper.success(res, {
        id: shift.id,
        status: shift.status,
        openingCash: shift.openingCash,
        openedAt: shift.openedAt.toISOString(),
      }, 201);
    } catch (error) {
      next(error);
    }
  });

  router.post('/shifts/:shiftId/close', auth, async (req, res, next) => {
    try {
      const parsed = closeShiftSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data tutup shift tidak valid');
      const shift = await posService.closeShift(
        param(req.params.shiftId),
        parsed.data.closingCash,
        req.user!,
      );
      return ResponseWrapper.success(res, {
        id: shift.id,
        status: shift.status,
        openingCash: shift.openingCash,
        closingCash: shift.closingCash,
        openedAt: shift.openedAt.toISOString(),
        closedAt: shift.closedAt?.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/shifts/current', auth, async (req, res, next) => {
    try {
      const shift = await posService.getOpenShift(req.user!.sub);
      return ResponseWrapper.success(res, shift
        ? {
            id: shift.id,
            status: shift.status,
            openingCash: shift.openingCash,
            openedAt: shift.openedAt.toISOString(),
          }
        : null);
    } catch (error) {
      next(error);
    }
  });

  router.get('/owner/dashboard/today', auth, requireRole('owner'), async (_req, res, next) => {
    try {
      const dashboard = await posService.getOwnerDashboardToday();
      return ResponseWrapper.success(res, dashboard);
    } catch (error) {
      next(error);
    }
  });

  router.get('/owner/dashboard/month', auth, requireRole('owner'), async (req, res, next) => {
    try {
      const parsed = dashboardMonthQuerySchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationException('Periode tidak valid');
      const dashboard = await posService.getOwnerDashboardMonth(parsed.data.year, parsed.data.month);
      return ResponseWrapper.success(res, {
        ...dashboard,
        year: parsed.data.year,
        month: parsed.data.month,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
