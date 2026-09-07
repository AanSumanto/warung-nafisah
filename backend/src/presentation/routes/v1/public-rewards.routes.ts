import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { getEnv } from '../../../config/env.js';
import type { PublicMemberRewardsService } from '../../../application/loyalty/PublicMemberRewardsService.js';

const GENERIC_NOT_FOUND = 'Member tidak ditemukan';

/**
 * Public member portal rate limit — separate from cashier POS traffic.
 * Default 60/min/IP: enough for QR scans + retries, blocks enumeration floods.
 */
export function createPublicMemberRewardsRateLimit() {
  return rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => getEnv().NODE_ENV === 'test',
    message: {
      success: false,
      error: {
        code: 'PUBLIC_429',
        message: 'Terlalu banyak permintaan. Coba lagi nanti.',
      },
    },
  });
}

function applyNoStore(res: import('express').Response): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

/**
 * Public read-only member rewards API.
 * GET only — no auth session; opaque token is the capability.
 */
export function createPublicRewardsRouter(service: PublicMemberRewardsService): Router {
  const router = Router();
  const limiter = createPublicMemberRewardsRateLimit();

  router.get('/public/rewards/member/:token', limiter, async (req, res, next) => {
    try {
      applyNoStore(res);
      const token = Array.isArray(req.params.token) ? req.params.token[0]! : req.params.token;
      const data = await service.getByPublicToken(token ?? '');
      return ResponseWrapper.success(res, data);
    } catch (error) {
      applyNoStore(res);
      next(error);
    }
  });

  // Explicitly reject mutations on this path prefix
  router.all('/public/rewards/member/:token', (_req, res) => {
    applyNoStore(res);
    return ResponseWrapper.error(res, 'SYS_405', 'Metode tidak diizinkan', 405);
  });

  // Catch-all: never expose public search
  router.get('/public/rewards/member', (_req, res) => {
    applyNoStore(res);
    return ResponseWrapper.error(res, 'SYS_002', GENERIC_NOT_FOUND, 404);
  });

  return router;
}
