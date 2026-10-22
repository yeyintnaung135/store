import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

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
  const jwt = { sign: vi.fn(() => 'signed-token') };
  const prisma = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
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
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('registers with an email and returns a JWT', async () => {
    prisma.user.create.mockResolvedValue({ ...user, phone: null });

    await expect(
      service.register({
        name: 'Aung',
        password: 'secret-password',
        email: 'Aung@Example.com',
      }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: { email: 'aung@example.com', phone: null },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Aung',
        passwordHash: 'hashed:secret-password',
        email: 'aung@example.com',
      },
    });
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'CUSTOMER' });
  });

  it('registers with a phone number', async () => {
    prisma.user.create.mockResolvedValue({ ...user, email: null });

    await service.register({
      name: 'Aung',
      password: 'secret-password',
      phone: '+959123456789',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ phone: '+959123456789' }),
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

  it('rejects a duplicate email or phone', async () => {
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

  it('logs in with an email or a phone number', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.login({ email: 'aung@example.com', password: 'secret-password' }),
    ).resolves.toMatchObject({ accessToken: 'signed-token' });
    await expect(
      service.login({ phone: '+959123456789', password: 'secret-password' }),
    ).resolves.toMatchObject({ accessToken: 'signed-token' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { phone: '+959123456789' },
    });
  });

  it('rejects a wrong password and an inactive account', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(
      service.login({ email: 'aung@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid email, phone, or password');

    prisma.user.findUnique.mockResolvedValue({ ...user, isActive: false });
    await expect(
      service.login({ email: 'aung@example.com', password: 'secret-password' }),
    ).rejects.toThrow('Invalid email, phone, or password');
  });

  it('stores only a hash when creating a reset token', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);

    const token = await service.createResetToken({
      email: 'aung@example.com',
    });

    expect(token).toEqual(expect.any(String));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordResetTokenHash: expect.not.stringMatching(token!),
        passwordResetExpiresAt: expect.any(Date),
      },
    });
  });

  it('does not create a reset token for an unknown account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.createResetToken({ phone: '+959123456789' }),
    ).resolves.toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('resets the password when the token hash matches', async () => {
    const token = 'reset-token';
    prisma.user.findFirst.mockImplementation(
      async (args: { where: { passwordResetTokenHash: string } }) => ({
        ...user,
        passwordResetTokenHash: args.where.passwordResetTokenHash,
      }),
    );
    prisma.user.update.mockResolvedValue(user);

    await service.resetPassword(token, 'new-password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'hashed:new-password',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
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
