import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BaseException } from '../../core/exceptions/BaseException.js';
import type { UserRole } from '../../domain/pos/PosTypes.js';
import { getUserModel } from './documents/UserDocument.js';

export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface JwtPayload {
  readonly sub: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized') {
    super('AUTH_001', message, 401);
  }
}

export class AuthService {
  constructor(private readonly jwtSecret: string) {}

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const user = await getUserModel().findOne({ email: email.toLowerCase(), isActive: true }).lean();
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const authUser: AuthUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      {
        sub: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
      } satisfies JwtPayload,
      this.jwtSecret,
      { expiresIn: '12h' },
    );

    return { token, user: authUser };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }
  }
}
