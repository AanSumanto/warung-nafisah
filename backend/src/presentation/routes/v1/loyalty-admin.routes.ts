import { Router } from 'express';
import { z } from 'zod';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { ValidationException, ForbiddenException } from '../../../core/exceptions/BaseException.js';
import type { LoyaltyAnalyticsService } from '../../../application/loyalty/LoyaltyAnalyticsService.js';
import type { LoyaltyManualAdjustmentService } from '../../../application/loyalty/LoyaltyManualAdjustmentService.js';
import type { AuthService } from '../../../infrastructure/auth/AuthService.js';
import { createAuthMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { getEnv } from '../../../config/env.js';
import { LOYALTY_LEDGER_TYPES } from '../../../domain/loyalty/LoyaltyLedgerTypes.js';

const dashboardQuerySchema = z.object({
  preset: z.enum(['today', '7d', '30d', 'month', 'custom']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
});

const ledgerQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().optional(),
  type: z.enum(LOYALTY_LEDGER_TYPES).optional(),
});

const adjustSchema = z.object({
  pointsDelta: z.number().int(),
  reason: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional(),
  requestId: z.string().trim().min(8).max(80),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

/**
 * Owner-only loyalty admin analytics + manual adjustment.
 * Kasir: denied for all routes in this router.
 */
export function createLoyaltyAdminRouter(
  analytics: LoyaltyAnalyticsService,
  adjustments: LoyaltyManualAdjustmentService,
  authService: AuthService,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authService);
  const ownerOnly = requireRole('owner');

  router.get('/admin/loyalty/gates', auth, ownerOnly, async (_req, res, next) => {
    try {
      return ResponseWrapper.success(res, {
        adminAdjustmentEnabled: getEnv().LOYALTY_ADMIN_ADJUSTMENT_ENABLED,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/loyalty/dashboard', auth, ownerOnly, async (req, res, next) => {
    try {
      const parsed = dashboardQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationException('Query dashboard tidak valid', {
          code: 'LOYALTY_ANALYTICS_INVALID_RANGE',
        });
      }
      const data = await analytics.getDashboard(parsed.data);
      return ResponseWrapper.success(res, data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/loyalty/customers/search', auth, ownerOnly, async (req, res, next) => {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationException('Query pencarian tidak valid', {
          code: 'LOYALTY_ADMIN_SEARCH_INVALID',
        });
      }
      const items = await analytics.searchMembers(parsed.data.q);
      return ResponseWrapper.success(res, { items });
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/loyalty/customers/:customerId', auth, ownerOnly, async (req, res, next) => {
    try {
      const data = await analytics.getMemberDetail(param(req.params.customerId));
      return ResponseWrapper.success(res, data);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/admin/loyalty/customers/:customerId/ledger',
    auth,
    ownerOnly,
    async (req, res, next) => {
      try {
        const parsed = ledgerQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          throw new ValidationException('Query ledger tidak valid');
        }
        const data = await analytics.getMemberLedger(param(req.params.customerId), parsed.data);
        return ResponseWrapper.success(res, data);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/admin/loyalty/customers/:customerId/verify-balance',
    auth,
    ownerOnly,
    async (req, res, next) => {
      try {
        const data = await analytics.verifyBalance(param(req.params.customerId));
        return ResponseWrapper.success(res, data);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    '/admin/loyalty/customers/:customerId/adjustments',
    auth,
    ownerOnly,
    async (req, res, next) => {
      try {
        // Defense in depth — role already ownerOnly; still reject non-owner explicitly
        if (req.user?.role !== 'owner') {
          throw new ForbiddenException('Hanya owner yang dapat menyesuaikan poin');
        }
        const parsed = adjustSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationException('Data penyesuaian tidak valid', {
            code: 'LOYALTY_ADJUSTMENT_INVALID_INPUT',
          });
        }
        const result = await adjustments.adjust({
          customerId: param(req.params.customerId),
          pointsDelta: parsed.data.pointsDelta,
          reason: parsed.data.reason,
          note: parsed.data.note,
          requestId: parsed.data.requestId,
          actorUserId: req.user!.sub,
        });
        return ResponseWrapper.success(res, result, result.alreadyProcessed ? 200 : 201);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
