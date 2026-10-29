import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { startTestServer } from './start-test-server.js';
import { testDatabaseUrl } from './test-database.js';

describe('Orders (e2e)', () => {
  const runId = randomUUID().slice(0, 8);
  const password = 'secret-password';
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });

  let baseUrl: string;
  let stop: () => Promise<void>;
  let adminToken: string;
  let customerToken: string;
  let otherToken: string;
  let productId: string;

  function slug(name: string): string {
    return `${runId}-${name}`;
  }

  beforeAll(async () => {
    ({ baseUrl, stop } = await startTestServer());

    const adminEmail = `${runId}-admin@example.com`;
    await request(baseUrl)
      .post('/auth/register')
      .send({ name: `${runId} Admin`, email: adminEmail, password })
      .expect(201);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    const admin = await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: adminEmail, password })
      .expect(200);
    adminToken = admin.body.accessToken;

    const customer = await request(baseUrl)
      .post('/auth/register')
      .send({
        name: `${runId} Customer`,
        email: `${runId}-customer@example.com`,
        password,
      })
      .expect(201);
    customerToken = customer.body.accessToken;

    const other = await request(baseUrl)
      .post('/auth/register')
      .send({
        name: `${runId} Other`,
        email: `${runId}-other@example.com`,
        password,
      })
      .expect(201);
    otherToken = other.body.accessToken;

    const category = await request(baseUrl)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: slug('goods'), slug: slug('goods') })
      .expect(201);

    const product = await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: slug('headphones'),
        slug: slug('headphones'),
        price: 25.5,
        stock: 8,
        categoryId: category.body.id,
      })
      .expect(201);
    productId = product.body.id;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { startsWith: runId } } },
    });
    await prisma.order.deleteMany({
      where: { user: { email: { startsWith: runId } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: runId } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: runId } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: runId } },
    });
    await prisma.$disconnect();
    await stop?.();
  });

  it('requires a customer token to create or list orders', async () => {
    await request(baseUrl).post('/orders').send({ items: [] }).expect(401);
    await request(baseUrl).get('/orders/my').expect(401);
    await request(baseUrl).get('/admin/orders').expect(401);
  });

  it('rejects an empty order and a missing product', async () => {
    await request(baseUrl)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [] })
      .expect(400);

    await request(baseUrl)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000099',
            quantity: 1,
          },
        ],
      })
      .expect(404);
  });

  it('creates an order from catalog prices and hides it from other customers', async () => {
    const created = await request(baseUrl)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ productId, quantity: 2 }] })
      .expect(201);

    expect(created.body.status).toBe('PENDING');
    expect(Number(created.body.total)).toBe(51);
    expect(created.body.items).toEqual([
      expect.objectContaining({
        productId,
        productName: slug('headphones'),
        quantity: 2,
      }),
    ]);

    const mine = await request(baseUrl)
      .get('/orders/my')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(mine.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id }),
      ]),
    );
    expect(mine.body.meta.total).toBeGreaterThanOrEqual(1);

    await request(baseUrl)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    await request(baseUrl)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('blocks customers from admin orders and lets an admin move status forward', async () => {
    const created = await request(baseUrl)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ productId, quantity: 1 }] })
      .expect(201);

    await request(baseUrl)
      .get('/admin/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const listed = await request(baseUrl)
      .get('/admin/orders')
      .query({ search: `${runId} Customer`, status: 'PENDING' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(listed.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, status: 'PENDING' }),
      ]),
    );

    await request(baseUrl)
      .get(`/admin/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(baseUrl)
      .patch(`/admin/orders/${created.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED' })
      .expect(400);

    const confirmed = await request(baseUrl)
      .patch(`/admin/orders/${created.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(confirmed.body.status).toBe('CONFIRMED');

    const processing = await request(baseUrl)
      .patch(`/admin/orders/${created.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PROCESSING' })
      .expect(200);

    expect(processing.body.status).toBe('PROCESSING');
  });

  it('returns 400 for an admin order id that is not a uuid', async () => {
    await request(baseUrl)
      .get('/admin/orders/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });
});
