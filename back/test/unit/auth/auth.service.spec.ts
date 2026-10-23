import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';

import { Prisma } from '../../../src/generated/prisma/client.js';
import { AuthService } from '../../../src/auth/auth.service.js';
import { PrismaService } from '../../../src/prisma/prisma.service.js';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed:${value}`),
    compare: vi.fn(
      async (value: string, hash: string) => hash === `hashed:${value}`,
    ),
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  const jwt = {
    sign: vi.fn(() => 'signed-token'),
  };

  const prisma = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const user = {
    id: 'user-1',
    name: 'Aung',
    email: 'aung@example.com',
    phone: '+959123456789',
    role: 'CUSTOMER',
    isActive: true,
    passwordHash: 'hashed:secret-password',
    passwordResetTokenHash: null as string | null,
    passwordResetExpiresAt: null as Date | null,
    refreshTokenHash: null as string | null,
    refreshTokenExpiresAt: null as Date | null,
  };

  const hashToken = (token: string) =>
    createHash('sha256').update(token).digest('hex');

  beforeEach(async () => {
    vi.clearAllMocks();

    prisma.user.update.mockResolvedValue(user);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers with an email and creates a refresh session', async () => {
    prisma.user.create.mockResolvedValue({ ...user, phone: null });

    await expect(
      service.register({
        name: 'Aung',
        password: 'secret-password',
        email: 'Aung@Example.com',
      }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      refreshToken: expect.any(String),
      user: { email: 'aung@example.com', phone: null },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Aung',
        passwordHash: 'hashed:secret-password',
        email: 'aung@example.com',
      },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        refreshTokenHash: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      },
    });

    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'user-1', role: 'CUSTOMER' },
      { expiresIn: '15m' },
    );
  });

  it('registers with a phone number', async () => {
    prisma.user.create.mockResolvedValue({ ...user, email: null });

    const session = await service.register({
      name: 'Aung',
      password: 'secret-password',
      phone: '+959123456789',
    });

    expect(session.refreshToken).toEqual(expect.any(String));
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '+959123456789',
      }),
    });
  });

  it('rejects registration unless exactly one identifier is sent', async () => {
    await expect(
      service.register({ name: 'Aung', password: 'secret-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.register({
        name: 'Aung',
        password: 'secret-password',
        email: 'aung@example.com',
        phone: '+959123456789',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate email or phone', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );

    await expect(
      service.register({
        name: 'Aung',
        password: 'secret-password',
        email: 'aung@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with an email identifier and creates a refresh session', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const session = await service.login({
      identifier: 'aung@example.com',
      password: 'secret-password',
    });

    expect(session).toMatchObject({
      accessToken: 'signed-token',
      refreshToken: expect.any(String),
      user: { id: 'user-1' },
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'aung@example.com' },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        refreshTokenHash: hashToken(session.refreshToken),
        refreshTokenExpiresAt: expect.any(Date),
      },
    });
  });

  it('normalizes phone identifiers when logging in', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await service.login({
      identifier: ' +959 123 456 789 ',
      password: 'secret-password',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { phone: '+959123456789' },
    });
  });

  it('rejects a wrong password and an inactive account', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.login({
        identifier: 'aung@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid email, phone, or password');

    prisma.user.findUnique.mockResolvedValue({
      ...user,
      isActive: false,
    });

    await expect(
      service.login({
        identifier: 'aung@example.com',
        password: 'secret-password',
      }),
    ).rejects.toThrow('Invalid email, phone, or password');
  });

  it('refreshes a session and rotates the refresh token', async () => {
    const oldToken = 'old-refresh-token';

    prisma.user.findFirst.mockResolvedValue({
      ...user,
      refreshTokenHash: hashToken(oldToken),
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const session = await service.refresh(oldToken);

    expect(prisma.user.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'user-1',
          refreshTokenHash: hashToken(oldToken),
        }),
        data: {
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      }),
    );

    expect(session).toMatchObject({
      accessToken: 'signed-token',
      refreshToken: expect.any(String),
    });

    expect(session.refreshToken).not.toBe(oldToken);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        refreshTokenHash: hashToken(session.refreshToken),
        refreshTokenExpiresAt: expect.any(Date),
      },
    });
  });

  it('rejects a missing refresh token', async () => {
    await expect(service.refresh(undefined)).rejects.toThrow(
      'Refresh token is missing',
    );

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired refresh token', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.refresh('invalid-token')).rejects.toThrow(
      'Refresh token is invalid or expired',
    );

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('does not rotate a refresh token if another request already consumed it', async () => {
    const token = 'old-refresh-token';

    prisma.user.findFirst.mockResolvedValue({
      ...user,
      refreshTokenHash: hashToken(token),
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.refresh(token)).rejects.toThrow(
      'Refresh token is invalid or expired',
    );
  });

  it('revokes the refresh token on logout', async () => {
    const token = 'refresh-token-to-revoke';

    await service.logout(token);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        refreshTokenHash: hashToken(token),
      },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  });

  it('does nothing when logging out without a token', async () => {
    await service.logout(undefined);

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('stores only a hash when creating a reset token', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const token = await service.createResetToken({
      email: 'aung@example.com',
    });

    expect(token).toEqual(expect.any(String));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordResetTokenHash: hashToken(token!),
        passwordResetExpiresAt: expect.any(Date),
      },
    });

    expect(hashToken(token!)).not.toBe(token);
  });

  it('does not create a reset token for an unknown account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.createResetToken({ phone: '+959123456789' }),
    ).resolves.toBeNull();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('resets the password and revokes the refresh token', async () => {
    const token = 'reset-token';
    const tokenHash = hashToken(token);

    prisma.user.findFirst.mockResolvedValue({
      ...user,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });

    await service.resetPassword(token, 'new-password');

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: expect.any(Date) },
        isActive: true,
      },
      data: {
        passwordHash: 'hashed:new-password',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  });

  it('rejects a missing or expired reset token', async () => {
    await expect(
      service.resetPassword(undefined, 'new-password'),
    ).rejects.toThrow('Reset token is missing');

    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword('expired-token', 'new-password'),
    ).rejects.toThrow('Reset token is invalid or expired');
  });
});
