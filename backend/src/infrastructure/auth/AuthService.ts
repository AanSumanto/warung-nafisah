import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BaseException, ValidationException } from '../../core/exceptions/BaseException.js';
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
      { expiresIn: '12h', algorithm: 'HS256' },
    );

    return { token, user: authUser };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }
  }

  async authenticateToken(token: string): Promise<JwtPayload> {
    const payload = this.verifyToken(token);
    const user = await getUserModel().findOne({ _id: payload.sub, isActive: true }).lean();
    if (!user) {
      throw new UnauthorizedException('Token tidak valid');
    }

    return {
      sub: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await getUserModel().findOne({ _id: userId, isActive: true });
    if (!user) {
      throw new UnauthorizedException('Password saat ini salah');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Password saat ini salah');
    }

    if (currentPassword === newPassword) {
      throw new ValidationException('Password baru harus berbeda dari password saat ini');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    await user.save();
  }
}
