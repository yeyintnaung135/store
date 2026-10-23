import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { startTestServer } from './start-test-server.js';
import { testDatabaseUrl } from './test-database.js';

describe('Products (e2e)', () => {
  const runId = randomUUID().slice(0, 8);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });

  let baseUrl: string;
  let stop: () => Promise<void>;
  let accessToken: string;
  let customerToken: string;
  let categoryId: string;
  let otherCategoryId: string;

  function slug(name: string): string {
    return `${runId}-${name}`;
  }

  beforeAll(async () => {
    ({ baseUrl, stop } = await startTestServer());

    const category = await prisma.category.create({
      data: { name: slug('audio'), slug: slug('audio') },
    });
    const otherCategory = await prisma.category.create({
      data: { name: slug('cables'), slug: slug('cables') },
    });
    categoryId = category.id;
    otherCategoryId = otherCategory.id;

    const email = `${runId}@example.com`;
    await request(baseUrl)
      .post('/auth/register')
      .send({
        name: 'Product Editor',
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
      .send({ email, password: 'secret-password' })
      .expect(200);
    accessToken = loggedIn.body.accessToken;

    const customer = await request(baseUrl)
      .post('/auth/register')
      .send({
        name: 'Product Customer',
        password: 'secret-password',
        email: `${runId}-customer@example.com`,
      })
      .expect(201);
    customerToken = customer.body.accessToken;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { startsWith: runId } } },
    });
    await prisma.order.deleteMany({
      where: { orderNumber: { startsWith: runId } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: runId } },
    });
    await prisma.product.deleteMany({
      where: { slug: { startsWith: runId } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: runId } },
    });
    await prisma.$disconnect();
    await stop?.();
  });

  async function createProduct(
    name: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        slug: slug(name),
        description: `${name} description`,
        price: 59.99,
        stock: 4,
        categoryId,
        ...overrides,
      })
      .expect(201);

    return response.body as {
      id: string;
      name: string;
      slug: string;
      price: string;
      stock: number;
      categoryId: string;
    };
  }

  it('requires a bearer token for every product route', async () => {
    await request(baseUrl).get('/products').expect(401);
    await request(baseUrl)
      .get('/products/00000000-0000-4000-8000-000000000088')
      .expect(401);
    await request(baseUrl)
      .post('/products')
      .send({
        name: 'locked',
        slug: slug('locked'),
        price: 10,
        categoryId,
      })
      .expect(401);
  });

  it('lets a customer read products and blocks writes', async () => {
    const product = await createProduct('visible');

    await request(baseUrl)
      .get('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    await request(baseUrl)
      .get(`/products/${product.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'locked',
        slug: slug('customer'),
        price: 10,
        categoryId,
      })
      .expect(403);
    await request(baseUrl)
      .patch(`/products/${product.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ price: 12 })
      .expect(403);
    await request(baseUrl)
      .delete(`/products/${product.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('POST /products creates a product in its category', async () => {
    const product = await createProduct('headphones');

    expect(product).toMatchObject({
      name: 'headphones',
      slug: slug('headphones'),
      description: 'headphones description',
      price: '59.99',
      stock: 4,
      status: 'DRAFT',
      categoryId,
      category: { id: categoryId, slug: slug('audio') },
    });
    expect(product.id).toEqual(expect.any(String));
  });

  it('stores one photo link on create and update, then drops it on delete', async () => {
    const created = await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'camera',
        slug: slug('camera'),
        price: 40,
        categoryId,
        photoUrl: 'https://cdn.example.com/camera.jpg',
      })
      .expect(201);

    expect(created.body.photoUrl).toBe('https://cdn.example.com/camera.jpg');

    const updated = await request(baseUrl)
      .patch(`/products/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ photoUrl: 'https://cdn.example.com/camera-2.jpg' })
      .expect(200);

    expect(updated.body.photoUrl).toBe('https://cdn.example.com/camera-2.jpg');

    await request(baseUrl)
      .delete(`/products/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(baseUrl)
      .get(`/products/${created.body.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(404);
  });

  it('POST /products defaults stock to 0', async () => {
    const response = await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'adapter',
        slug: slug('adapter'),
        price: 12,
        categoryId,
      })
      .expect(201);

    expect(response.body.stock).toBe(0);
  });

  it('POST /products rejects an invalid body', async () => {
    await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'A',
        slug: 'x',
        price: -1,
        categoryId: 'not-a-uuid',
      })
      .expect(400);
  });

  it('POST /products returns 404 when the category does not exist', async () => {
    await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'orphan',
        slug: slug('orphan'),
        price: 10,
        categoryId: '00000000-0000-4000-8000-000000000099',
      })
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Category not found',
        error: 'Not Found',
      });
  });

  it('POST /products returns 409 when the slug already exists', async () => {
    await createProduct('speaker');

    await request(baseUrl)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'speaker copy',
        slug: slug('speaker'),
        price: 20,
        categoryId,
      })
      .expect(409)
      .expect({
        statusCode: 409,
        message: 'Product slug already exists',
        error: 'Conflict',
      });
  });

  it('GET /products filters by search and category and paginates', async () => {
    await createProduct('alpha cable', { categoryId: otherCategoryId });
    await createProduct('beta cable', { categoryId: otherCategoryId });

    const filtered = await request(baseUrl)
      .get('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .query({ search: 'cable', categoryId: otherCategoryId, limit: 1 })
      .expect(200);

    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].name).toBe('beta cable');
    expect(filtered.body.meta).toMatchObject({
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    });

    const secondPage = await request(baseUrl)
      .get('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .query({
        search: 'cable',
        categoryId: otherCategoryId,
        page: 2,
        limit: 1,
      })
      .expect(200);

    expect(secondPage.body.data[0].name).toBe('alpha cable');
  });

  it('GET /products/:id returns 400 for a non-uuid and 404 when missing', async () => {
    await request(baseUrl)
      .get('/products/not-a-uuid')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(400);
    await request(baseUrl)
      .get('/products/00000000-0000-4000-8000-000000000088')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      });
  });

  it('PATCH /products/:id updates a product and rejects a taken slug', async () => {
    const product = await createProduct('keyboard');
    await createProduct('mouse');

    const updated = await request(baseUrl)
      .patch(`/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ price: 79.5, stock: 8, description: 'Mechanical keyboard' })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: product.id,
      price: '79.5',
      stock: 8,
      description: 'Mechanical keyboard',
    });

    await request(baseUrl)
      .patch(`/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slug: slug('mouse') })
      .expect(409);
  });

  it('DELETE /products/:id removes a product', async () => {
    const product = await createProduct('charger');

    await request(baseUrl)
      .delete(`/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Product deleted successfully' });

    await request(baseUrl)
      .get(`/products/${product.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(404);
  });

  it('DELETE /products/:id returns 409 when an order still references it', async () => {
    const product = await createProduct('reserved');
    const user = await prisma.user.create({
      data: {
        email: `${runId}-buyer@example.com`,
        passwordHash: 'hash',
        name: 'E2E Buyer',
      },
    });
    await prisma.order.create({
      data: {
        orderNumber: `${runId}-order`,
        userId: user.id,
        total: '59.99',
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            unitPrice: '59.99',
            quantity: 1,
            subtotal: '59.99',
          },
        },
      },
    });

    await request(baseUrl)
      .delete(`/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409)
      .expect({
        statusCode: 409,
        message:
          'Cannot delete product because it is referenced by existing records',
        error: 'Conflict',
      });
  });
});
