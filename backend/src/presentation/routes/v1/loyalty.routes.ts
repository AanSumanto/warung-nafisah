import { Router } from 'express';
import { z } from 'zod';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { ValidationException } from '../../../core/exceptions/BaseException.js';
import type { LoyaltyProgramService } from '../../../application/loyalty/LoyaltyProgramService.js';
import type { RewardCatalogService } from '../../../application/loyalty/RewardCatalogService.js';
import type { AuthService } from '../../../infrastructure/auth/AuthService.js';
import { createAuthMiddleware, requireRole } from '../../middleware/auth.middleware.js';
import { REWARD_STATUSES } from '../../../domain/loyalty/LoyaltyTypes.js';
import { getEnv } from '../../../config/env.js';

const updateProgramSchema = z.object({
  pointEarnRate: z.number().int().positive().optional(),
  programName: z.string().trim().min(1).max(120).optional(),
  /** Accepted only as false / omitted — true is blocked in service. */
  enabled: z.boolean().optional(),
});

const createRewardSchema = z.object({
  rewardCode: z.string().trim().min(3).max(48),
  name: z.string().trim().min(1).max(120),
  menuKode: z.string().trim().min(1).max(32),
  pointsRequired: z.number().int().positive(),
  hppEstimate: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative(),
  status: z.enum(REWARD_STATUSES).optional(),
});

const updateRewardSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  menuKode: z.string().trim().min(1).max(32).optional(),
  pointsRequired: z.number().int().positive().optional(),
  hppEstimate: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  status: z.enum(REWARD_STATUSES).optional(),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

export function createLoyaltyConfigRouter(
  programService: LoyaltyProgramService,
  rewardService: RewardCatalogService,
  authService: AuthService,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authService);
  const staff = requireRole('owner', 'kasir');
  const ownerOnly = requireRole('owner');

  /** Technical UI rollout gate — not program.enable / earn business config. */
  router.get('/loyalty/pos-ui', auth, staff, async (_req, res, next) => {
    try {
      return ResponseWrapper.success(res, {
        memberUiEnabled: getEnv().LOYALTY_POS_UI_ENABLED,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/loyalty/program', auth, staff, async (_req, res, next) => {
    try {
      const program = await programService.getProgram();
      return ResponseWrapper.success(res, program);
    } catch (error) {
      next(error);
    }
  });

  router.put('/loyalty/program', auth, ownerOnly, async (req, res, next) => {
    try {
      const parsed = updateProgramSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException('Data program loyalty tidak valid', {
          code: 'LOYALTY_PROGRAM_INVALID_INPUT',
        });
      }
      if (
        parsed.data.pointEarnRate === undefined &&
        parsed.data.programName === undefined &&
        parsed.data.enabled === undefined
      ) {
        throw new ValidationException('Tidak ada field yang diubah', {
          code: 'LOYALTY_PROGRAM_INVALID_INPUT',
        });
      }

      const program = await programService.updateProgramConfig({
        pointEarnRate: parsed.data.pointEarnRate,
        programName: parsed.data.programName,
        enabled: parsed.data.enabled,
        updatedBy: req.user!.sub,
      });
      return ResponseWrapper.success(res, program);
    } catch (error) {
      next(error);
    }
  });

  router.get('/loyalty/rewards', auth, staff, async (_req, res, next) => {
    try {
      const rewards = await rewardService.listRewards();
      return ResponseWrapper.success(res, rewards);
    } catch (error) {
      next(error);
    }
  });

  router.get('/loyalty/rewards/:rewardCode', auth, staff, async (req, res, next) => {
    try {
      const reward = await rewardService.getReward(param(req.params.rewardCode));
      return ResponseWrapper.success(res, reward);
    } catch (error) {
      next(error);
    }
  });

  router.post('/loyalty/rewards', auth, ownerOnly, async (req, res, next) => {
    try {
      const parsed = createRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException('Data reward tidak valid', {
          code: 'LOYALTY_REWARD_INVALID_INPUT',
        });
      }
      const reward = await rewardService.createReward({
        ...parsed.data,
        updatedBy: req.user!.sub,
      });
      return ResponseWrapper.success(res, reward, 201);
    } catch (error) {
      next(error);
    }
  });

  router.put('/loyalty/rewards/:rewardCode', auth, ownerOnly, async (req, res, next) => {
    try {
      const parsed = updateRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException('Data reward tidak valid', {
          code: 'LOYALTY_REWARD_INVALID_INPUT',
        });
      }
      const reward = await rewardService.updateReward(param(req.params.rewardCode), {
        ...parsed.data,
        updatedBy: req.user!.sub,
      });
      return ResponseWrapper.success(res, reward);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
