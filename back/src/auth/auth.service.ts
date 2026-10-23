import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForgotPasswordDto } from './types/forgot-password.dto.js';
import { LoginDto } from './types/login.dto.js';
import { RegisterDto } from './types/register.dto.js';
import type { AuthToken, PublicUser } from './types/auth.types.js';
import { RESET_TOKEN_MAX_AGE_MS } from './reset-token.cookie.js';

const BCRYPT_ROUNDS = 12;

type Identifier = { email: string } | { phone: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthToken> {
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
      return this.issueToken(user);
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

  async login(dto: LoginDto): Promise<AuthToken> {
    const identifier = this.identifier(dto);
    const user = await this.prisma.user.findUnique({ where: identifier });
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Invalid email, phone, or password');
    }

    return this.issueToken(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  async createResetToken(dto: ForgotPasswordDto): Promise<string | null> {
    const identifier = this.identifier(dto);
    const user = await this.prisma.user.findUnique({ where: identifier });
    if (!user || !user.isActive) {
      return null;
    }

    const token = randomBytes(32).toString('base64url');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: this.hashResetToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS),
      },
    });
    return token;
  }

  async resetPassword(token: string | undefined, password: string) {
    if (!token) {
      throw new UnauthorizedException('Reset token is missing');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: this.hashResetToken(token),
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user || !this.sameResetToken(token, user.passwordResetTokenHash)) {
      throw new UnauthorizedException('Reset token is invalid or expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  private issueToken(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  }): AuthToken {
    return {
      accessToken: this.jwt.sign({ sub: user.id, role: user.role }),
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  private identifier(dto: { email?: string; phone?: string }): Identifier {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    if (Boolean(email) === Boolean(phone)) {
      throw new BadRequestException(
        'Provide either an email or a phone number',
      );
    }
    return email ? { email } : { phone: phone! };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sameResetToken(token: string, storedHash: string | null): boolean {
    if (!storedHash) {
      return false;
    }
    const actual = Buffer.from(this.hashResetToken(token));
    const expected = Buffer.from(storedHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
