import { Router } from 'express';
import { z } from 'zod';
import { ResponseWrapper } from '../../../core/http/ResponseWrapper.js';
import { ValidationException } from '../../../core/exceptions/BaseException.js';
import type { CustomerService } from '../../../application/loyalty/CustomerService.js';
import type { AuthService } from '../../../infrastructure/auth/AuthService.js';
import { createAuthMiddleware, requireRole } from '../../middleware/auth.middleware.js';

const registerCustomerSchema = z.object({
  phone: z.string().min(1).max(32),
  name: z.string().max(120).optional(),
});

const lookupQuerySchema = z.object({
  phone: z.string().min(1).max(32),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

/**
 * Authenticated customer APIs for cashier/owner.
 * No public/unauthenticated endpoints.
 */
export function createCustomerRouter(
  customerService: CustomerService,
  authService: AuthService,
): Router {
  const router = Router();
  const auth = createAuthMiddleware(authService);
  const staff = requireRole('owner', 'kasir');

  router.post('/customers', auth, staff, async (req, res, next) => {
    try {
      const parsed = registerCustomerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationException('Data pelanggan tidak valid', {
          code: 'CUSTOMER_INVALID_INPUT',
        });
      }

      const customer = await customerService.register({
        phone: parsed.data.phone,
        name: parsed.data.name,
        registeredBy: req.user!.sub,
      });

      return ResponseWrapper.success(res, customer, 201);
    } catch (error) {
      next(error);
    }
  });

  router.get('/customers/lookup', auth, staff, async (req, res, next) => {
    try {
      const parsed = lookupQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationException('Parameter phone tidak valid', {
          code: 'CUSTOMER_INVALID_PHONE',
        });
      }

      const customer = await customerService.lookupByPhone(parsed.data.phone);
      return ResponseWrapper.success(res, customer);
    } catch (error) {
      next(error);
    }
  });

  router.get('/customers/:customerId', auth, staff, async (req, res, next) => {
    try {
      const customer = await customerService.getById(param(req.params.customerId));
      return ResponseWrapper.success(res, customer);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
