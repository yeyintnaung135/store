import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { startTestServer } from './start-test-server.js';
import { testDatabaseUrl } from './test-database.js';

describe('Categories (e2e)', () => {
  const runId = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });

  let baseUrl: string;
  let stop: () => Promise<void>;
  let accessToken: string;
  let customerToken: string;

  function slug(name: string): string {
    return `${runId}-${name}`;
  }

  beforeAll(async () => {
    ({ baseUrl, stop } = await startTestServer());

    const email = `${runId}@example.com`;
    await request(baseUrl)
      .post('/auth/register')
      .send({
        name: 'Category Editor',
        password: 'secret-password',
        email,
      })
      .expect(201);
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    const loggedIn = await request(baseUrl)
      .post('/auth/login')
      .send({ identifier: email, password: 'secret-password' })
      .expect(200);
    accessToken = loggedIn.body.accessToken;

    const customer = await request(baseUrl)
      .post('/auth/register')
      .send({
        name: 'Category Customer',
        password: 'secret-password',
        email: `${runId}-customer@example.com`,
      })
      .expect(201);
    customerToken = customer.body.accessToken;
  });

  afterAll(async () => {
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

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string) {
    return request(baseUrl)
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  it('requires a bearer token for every category route', async () => {
    await request(baseUrl).get('/categories').expect(401);
    await request(baseUrl)
      .post('/categories')
      .send({ name: 'Locked', slug: slug('locked') })
      .expect(401);
  });

  it('blocks a customer from reading or changing categories', async () => {
    await request(baseUrl)
      .get('/categories')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(baseUrl)
      .get('/categories/00000000-0000-4000-8000-000000000088')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(baseUrl)
      .post('/categories')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: slug('denied'), slug: slug('denied') })
      .expect(403);

    await request(baseUrl)
      .patch('/categories/00000000-0000-4000-8000-000000000088')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: slug('denied') })
      .expect(403);

    await request(baseUrl)
      .delete('/categories/00000000-0000-4000-8000-000000000088')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('creates, lists, updates, and deletes a category', async () => {
    const created = await authed('post', '/categories')
      .send({ name: slug('audio'), slug: slug('audio') })
      .expect(201);

    expect(created.body).toMatchObject({
      name: slug('audio'),
      slug: slug('audio'),
    });

    const listed = await authed('get', '/categories').expect(200);
    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, slug: slug('audio') }),
      ]),
    );

    const one = await authed('get', `/categories/${created.body.id}`).expect(
      200,
    );
    expect(one.body._count.products).toBe(0);

    const updated = await authed('patch', `/categories/${created.body.id}`)
      .send({ name: slug('sound') })
      .expect(200);
    expect(updated.body.name).toBe(slug('sound'));

    await authed('delete', `/categories/${created.body.id}`)
      .expect(200)
      .expect({ message: 'Category deleted successfully' });

    await authed('get', `/categories/${created.body.id}`).expect(404);
  });

  it('rejects a duplicate slug and a category that still has products', async () => {
    const created = await authed('post', '/categories')
      .send({ name: slug('cables'), slug: slug('cables') })
      .expect(201);

    await authed('post', '/categories')
      .send({ name: slug('wires'), slug: slug('cables') })
      .expect(409);

    await prisma.product.create({
      data: {
        name: slug('hdmi'),
        slug: slug('hdmi'),
        price: '10.00',
        categoryId: created.body.id,
      },
    });

    await authed('delete', `/categories/${created.body.id}`)
      .expect(409)
      .expect({
        statusCode: 409,
        message: 'Cannot delete category while products reference it',
        error: 'Conflict',
      });
  });

  it('returns 400 for a non-uuid id', async () => {
    await authed('get', '/categories/not-a-uuid').expect(400);
  });
});
