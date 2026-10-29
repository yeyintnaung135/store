import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { startTestServer } from './start-test-server.js';
import { testDatabaseUrl } from './test-database.js';

describe('Auth (e2e)', () => {
  const runId = randomUUID().slice(0, 8);
  const password = 'secret-password';
  const phone = `+959${String(Date.now()).slice(-8)}`;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });

  let baseUrl: string;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    ({ baseUrl, stop } = await startTestServer());
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: runId } }, { phone }],
      },
    });
    await prisma.$disconnect();
    await stop?.();
  });

  it('registers with an email, then reads the current user', async () => {
    const email = `${runId}-user@example.com`;
    const agent = request.agent(baseUrl);

    const registered = await agent
      .post('/auth/register')
      .send({ name: 'E2E User', email, password })
      .expect(201);

    expect(registered.body.accessToken).toEqual(expect.any(String));
    expect(registered.body.user).toMatchObject({
      name: 'E2E User',
      email,
      role: 'CUSTOMER',
    });
    expect(registered.headers['set-cookie']?.join(';')).toContain(
      'refresh_token=',
    );

    const me = await agent
      .get('/auth/me')
      .set('Authorization', `Bearer ${registered.body.accessToken}`)
      .expect(200);

    expect(me.body).toMatchObject({ email, name: 'E2E User' });
  });

  it('registers with a phone number', async () => {
    const registered = await request(baseUrl)
      .post('/auth/register')
      .send({ name: 'Phone User', phone, password })
      .expect(201);

    expect(registered.body.user.phone).toBe(phone);
  });

  it('rejects registration without a contact method or with a short password', async () => {
    await request(baseUrl)
      .post('/auth/register')
      .send({ name: 'Nobody', password })
      .expect(400);

    await request(baseUrl)
      .post('/auth/register')
      .send({
        name: 'Nobody',
        email: `${runId}-short@example.com`,
        password: 'short',
      })
      .expect(400);
  });

  it('rejects a duplicate email', async () => {
    const email = `${runId}-dup@example.com`;

    await request(baseUrl)
      .post('/auth/register')
      .send({ name: 'First', email, password })
      .expect(201);

    await request(baseUrl)
      .post('/auth/register')
      .send({ name: 'Second', email, password })
      .expect(409);
  });

  it('logs in with an identifier and rejects a bad password', async () => {
    const email = `${runId}-login@example.com`;

    await request(baseUrl)
      .post('/auth/register')
      .send({ name: 'Login User', email, password })
      .expect(201);

    const loggedIn = await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(200);

    expect(loggedIn.body.user.email).toBe(email);
    expect(loggedIn.body.accessToken).toEqual(expect.any(String));

    await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: email, password: 'wrong-password' })
      .expect(401);

    await request(baseUrl)
      .post('/auth/login')
      .send({ email, password })
      .expect(400);
  });

  it('rotates the refresh cookie and rejects a missing session', async () => {
    const email = `${runId}-refresh@example.com`;
    const agent = request.agent(baseUrl);

    const registered = await agent
      .post('/auth/register')
      .send({ name: 'Refresh User', email, password })
      .expect(201);

    const refreshed = await agent.post('/auth/refresh').expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.accessToken).not.toBe(registered.body.accessToken);

    await request(baseUrl).post('/auth/refresh').expect(401);
    await request(baseUrl).get('/auth/me').expect(401);
  });

  it('logs out and then refuses to refresh', async () => {
    const email = `${runId}-logout@example.com`;
    const agent = request.agent(baseUrl);

    await agent
      .post('/auth/register')
      .send({ name: 'Logout User', email, password })
      .expect(201);

    await agent
      .post('/auth/logout')
      .expect(200)
      .expect({ message: 'Logged out successfully' });

    await agent.post('/auth/refresh').expect(401);
  });

  it('resets a password with the reset cookie', async () => {
    const email = `${runId}-reset@example.com`;
    const agent = request.agent(baseUrl);
    const nextPassword = 'updated-password';

    await agent
      .post('/auth/register')
      .send({ name: 'Reset User', email, password })
      .expect(201);

    const forgot = await agent
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect(forgot.body.message).toContain('reset token');
    expect(forgot.headers['set-cookie']?.join(';')).toContain('reset_token=');

    await agent
      .post('/auth/reset-password')
      .send({ password: nextPassword })
      .expect(200)
      .expect({ message: 'Password updated' });

    await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: email, password })
      .expect(401);

    await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: email, password: nextPassword })
      .expect(200);
  });

  it('does not reveal whether a forgotten account exists', async () => {
    await request(baseUrl)
      .post('/auth/forgot-password')
      .send({ email: `${runId}-missing@example.com` })
      .expect(200)
      .expect({
        message: 'If an account exists, the reset token was stored in a cookie',
      });

    await request(baseUrl)
      .post('/auth/reset-password')
      .send({ password: 'updated-password' })
      .expect(401);
  });
});
