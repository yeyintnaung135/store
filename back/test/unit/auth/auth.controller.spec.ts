import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../../../src/auth/auth.controller.js';
import { AuthService } from '../../../src/auth/auth.service.js';
import { JwtAuthGuard } from '../../../src/auth/jwt-auth.guard.js';

describe('AuthController', () => {
  let app: INestApplication<App>;
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
    createResetToken: vi.fn(),
    resetPassword: vi.fn(),
  };
  const jwt = {
    verify: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: jwt },
        JwtAuthGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns a JWT in the body and does not set a cookie', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'jwt-token',
      user: { id: 'user-1' },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'aung@example.com', password: 'secret-password' })
      .expect(200);

    expect(response.body.accessToken).toBe('jwt-token');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('puts the reset token only in an httpOnly cookie', async () => {
    authService.createResetToken.mockResolvedValue('reset-raw-token');

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ phone: '+959123456789' })
      .expect(200);

    expect(response.body).toEqual({
      message: 'If an account exists, the reset token was stored in a cookie',
    });
    expect(JSON.stringify(response.body)).not.toContain('reset-raw-token');
    const cookie = [response.headers['set-cookie']].flat().join(';');
    expect(cookie).toContain('reset_token=reset-raw-token');
    expect(cookie.toLowerCase()).toContain('httponly');
  });

  it('reads the reset token from the cookie', async () => {
    authService.resetPassword.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .set('Cookie', ['reset_token=reset-raw-token'])
      .send({ password: 'new-password' })
      .expect(200);

    expect(authService.resetPassword).toHaveBeenCalledWith(
      'reset-raw-token',
      'new-password',
    );
    expect([response.headers['set-cookie']].flat().join(';')).toContain(
      'reset_token=',
    );
    expect(response.body).toEqual({ message: 'Password updated' });
  });

  it('rejects /auth/me when the bearer token is missing', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    expect(authService.me).not.toHaveBeenCalled();
  });
});
