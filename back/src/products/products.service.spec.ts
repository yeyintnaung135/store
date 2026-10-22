import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from './products.service.js';

const categoryId = '00000000-0000-4000-8000-000000000001';
const productId = '00000000-0000-4000-8000-000000000002';

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('database request failed', {
    code,
    clientVersion: '7.10.1',
  });
}

describe('ProductsService', () => {
  let service: ProductsService;

  const prisma = {
    product: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('create', () => {
    const dto = {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Bluetooth headphones',
      price: 59.99,
      stock: 4,
      categoryId,
    };

    it('creates a product and includes its category', async () => {
      const created = { id: productId, ...dto };
      prisma.product.create.mockResolvedValue(created);

      await expect(service.create(dto)).resolves.toBe(created);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price: dto.price,
          stock: 4,
          categoryId,
        },
        include: { category: true },
      });
    });

    it('defaults stock to 0 when it is omitted', async () => {
      prisma.product.create.mockResolvedValue({ id: productId });

      await service.create({ ...dto, stock: undefined });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stock: 0 }),
        }),
      );
    });

    it('rejects a duplicate slug', async () => {
      prisma.product.create.mockRejectedValue(knownRequestError('P2002'));

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a missing category', async () => {
      prisma.product.create.mockRejectedValue(knownRequestError('P2003'));

      await expect(service.create(dto)).rejects.toThrow('Category not found');
    });

    it('rethrows unexpected database errors', async () => {
      const error = new Error('connection lost');
      prisma.product.create.mockRejectedValue(error);

      await expect(service.create(dto)).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    it('returns a page of products', async () => {
      const items = [{ id: productId }];
      prisma.product.findMany.mockResolvedValue(items);
      prisma.product.count.mockResolvedValue(21);

      await expect(service.findAll(2, 10)).resolves.toEqual({
        data: items,
        meta: { total: 21, page: 2, limit: 10, totalPages: 3 },
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      });
    });

    it('filters by search text and category', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll(1, 10, 'cable', categoryId);

      const where = {
        OR: [
          { name: { contains: 'cable', mode: 'insensitive' } },
          { description: { contains: 'cable', mode: 'insensitive' } },
        ],
        categoryId,
      };
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('findOne', () => {
    it('returns the product', async () => {
      const product = { id: productId, category: { id: categoryId } };
      prisma.product.findUnique.mockResolvedValue(product);

      await expect(service.findOne(productId)).resolves.toBe(product);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: { category: true },
      });
    });

    it('rejects an unknown product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('update', () => {
    it('updates only the fields that were sent', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      const updated = { id: productId, price: 79.5, stock: 8 };
      prisma.product.update.mockResolvedValue(updated);

      await expect(
        service.update(productId, { price: 79.5, stock: 8 }),
      ).resolves.toBe(updated);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { price: 79.5, stock: 8 },
        include: { category: true },
      });
    });

    it('rejects an unknown product before updating', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update(productId, { name: 'Mouse' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('rejects a duplicate slug', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      prisma.product.update.mockRejectedValue(knownRequestError('P2002'));

      await expect(
        service.update(productId, { slug: 'taken-slug' }),
      ).rejects.toThrow('Product slug already exists');
    });

    it('rejects a missing category', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      prisma.product.update.mockRejectedValue(knownRequestError('P2003'));

      await expect(service.update(productId, { categoryId })).rejects.toThrow(
        'Category not found',
      );
    });
  });

  describe('remove', () => {
    it('deletes the product', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      prisma.product.delete.mockResolvedValue({ id: productId });

      await expect(service.remove(productId)).resolves.toEqual({
        message: 'Product deleted successfully',
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('rejects an unknown product before deleting', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('rejects a product that is still referenced', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      prisma.product.delete.mockRejectedValue(knownRequestError('P2003'));

      await expect(service.remove(productId)).rejects.toThrow(
        'Cannot delete product because it is referenced by existing records',
      );
    });
  });
});
