import { Router } from 'express';
import { z } from 'zod';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { ValidationException } from '../../../core/exceptions/BaseException.js';
import type { PosService } from '../../../application/pos/PosService.js';
import type { AuthService } from '../../../infrastructure/auth/AuthService.js';
import { createAuthMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createOrderSchema = z.object({
  diningType: z.enum(['dine_in', 'take_away']),
});

const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      kodeMenu: z.string().min(1),
      qty: z.number().int().positive(),
      note: z.string().optional(),
    }),
  ),
});

const payOrderSchema = z.object({
  paymentMethod: z.enum(['cash', 'qris', 'transfer']),
  paidAmount: z.number().int().nonnegative().optional(),
});

const openShiftSchema = z.object({
  openingCash: z.number().int().nonnegative(),
});

const closeShiftSchema = z.object({
  closingCash: z.number().int().nonnegative(),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
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

  router.post('/auth/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data login tidak valid');
      const result = await authService.login(parsed.data.email, parsed.data.password);
      return ResponseWrapper.success(res, result);
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
      const order = await posService.updateOrderItems(param(req.params.orderId), parsed.data.items);
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.post('/orders/:orderId/pay', auth, async (req, res, next) => {
    try {
      const parsed = payOrderSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationException('Data pembayaran tidak valid');
      const order = await posService.payOrder({
        orderId: param(req.params.orderId),
        paymentMethod: parsed.data.paymentMethod,
        paidAmount: parsed.data.paidAmount,
        correlationId: req.context?.correlationId,
      });
      return ResponseWrapper.success(res, mapOrder(order));
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/today', auth, async (_req, res, next) => {
    try {
      const orders = await posService.listTodayOrders();
      return ResponseWrapper.success(res, orders.map(mapOrder));
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:orderId', auth, async (req, res, next) => {
    try {
      const order = await posService.getOrder(param(req.params.orderId));
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
      const shift = await posService.closeShift(param(req.params.shiftId), parsed.data.closingCash);
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

  return router;
}
