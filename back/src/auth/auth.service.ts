import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import { Prisma } from '../generated/prisma/client.js';
import type { UserRole } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthSession, AuthToken, PublicUser } from './auth.types.js';
import { RESET_TOKEN_MAX_AGE_MS } from './reset-token.cookie.js';
import { REFRESH_TOKEN_MAX_AGE_MS } from './refresh-token.cookie.js';

const BCRYPT_ROUNDS = 12;

type Identifier = { email: string } | { phone: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const identifier = this.identifier(dto);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          passwordHash,
          ...identifier,
        },
      });

      return this.createSession(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or phone is already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const identifier = this.loginIdentifier(dto.identifier);

    const user = await this.prisma.user.findUnique({
      where: identifier,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email, phone, or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email, phone, or password');
    }

    return this.createSession(user);
  }

  async refresh(token: string | undefined): Promise<AuthSession> {
    if (!token) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokenHash = this.hashToken(token);
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        refreshTokenExpiresAt: { gt: now },
        isActive: true,
      },
    });

    if (!user || !this.sameToken(token, user.refreshTokenHash)) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Atomically consume the old token to prevent concurrent reuse.
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        refreshTokenHash: tokenHash,
        refreshTokenExpiresAt: { gt: new Date() },
        isActive: true,
      },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    return this.createSession(user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.prisma.user.updateMany({
      where: {
        refreshTokenHash: this.hashToken(token),
      },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.toPublicUser(user);
  }

  async createResetToken(dto: ForgotPasswordDto): Promise<string | null> {
    const identifier = this.identifier(dto);

    const user = await this.prisma.user.findUnique({
      where: identifier,
    });

    if (!user || !user.isActive) {
      return null;
    }

    const token = randomBytes(32).toString('base64url');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: this.hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS),
      },
    });

    return token;
  }

  async resetPassword(
    token: string | undefined,
    password: string,
  ): Promise<void> {
    if (!token) {
      throw new UnauthorizedException('Reset token is missing');
    }

    const tokenHash = this.hashToken(token);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user || !this.sameToken(token, user.passwordResetTokenHash)) {
      throw new UnauthorizedException('Reset token is invalid or expired');
    }

    // Changing the password also revokes the stored refresh token.
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true,
      },
      data: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      throw new UnauthorizedException('Reset token is invalid or expired');
    }
  }

  private async createSession(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
  }): Promise<AuthSession> {
    const refreshToken = randomBytes(32).toString('base64url');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: this.hashToken(refreshToken),
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
      },
    });

    return {
      ...this.issueToken(user),
      refreshToken,
    };
  }

  private issueToken(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
  }): AuthToken {
    return {
      accessToken: this.jwt.sign(
        {
          sub: user.id,
          role: user.role,
        },
        {
          expiresIn: '15m',
          jwtid: randomUUID(),
        },
      ),
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  private loginIdentifier(value: string): Identifier {
    const input = value.trim();

    if (!input) {
      throw new BadRequestException('Email or phone number is required');
    }

    if (input.includes('@')) {
      return { email: input.toLowerCase() };
    }

    const phone = input.replace(/[\s()-]/g, '');

    if (!phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    return { phone };
  }

  private identifier(dto: { email?: string; phone?: string }): Identifier {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim().replace(/\s+/g, '');

    const hasEmail = Boolean(email);
    const hasPhone = Boolean(phone);

    if (hasEmail === hasPhone) {
      throw new BadRequestException(
        'Provide either an email or a phone number',
      );
    }

    if (email) {
      return { email };
    }

    return { phone: phone! };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sameToken(token: string, storedHash: string | null): boolean {
    if (!storedHash) {
      return false;
    }

    const actual = Buffer.from(this.hashToken(token), 'hex');
    const expected = Buffer.from(storedHash, 'hex');

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
