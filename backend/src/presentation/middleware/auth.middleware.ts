import type { NextFunction, Request, Response } from 'express';
import type { AuthService, JwtPayload } from '../../infrastructure/auth/AuthService.js';
import { UnauthorizedException } from '../../infrastructure/auth/AuthService.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new UnauthorizedException('Token diperlukan'));
      return;
    }

    const token = header.slice('Bearer '.length);
    try {
      req.user = await authService.authenticateToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new UnauthorizedException('Akses ditolak'));
      return;
    }
    next();
  };
}
