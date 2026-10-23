import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { PrismaService } from '../../../src/prisma/prisma.service.js';
import { CategoriesService } from '../../../src/categories/categories.service.js';

const categoryId = '00000000-0000-4000-8000-000000000001';

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('database request failed', {
    code,
    clientVersion: '7.10.1',
  });
}

describe('CategoriesService', () => {
  let service: CategoriesService;

  const prisma = {
    category: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
  };

  const category = {
    id: categoryId,
    name: 'Electronics',
    slug: 'electronics',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('creates a category', async () => {
    prisma.category.create.mockResolvedValue(category);

    await expect(
      service.create({ name: 'Electronics', slug: 'electronics' }),
    ).resolves.toBe(category);
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Electronics', slug: 'electronics' },
    });
  });

  it('rejects a duplicate category name or slug', async () => {
    prisma.category.create.mockRejectedValue(knownRequestError('P2002'));

    await expect(
      service.create({ name: 'Electronics', slug: 'electronics' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists categories by name', async () => {
    prisma.category.findMany.mockResolvedValue([category]);

    await expect(service.findAll()).resolves.toEqual([category]);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  });

  it('returns one category', async () => {
    prisma.category.findUnique.mockResolvedValue(category);

    await expect(service.findOne(categoryId)).resolves.toBe(category);
  });

  it('rejects an unknown category', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findOne(categoryId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a category', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    const updated = { ...category, name: 'Audio' };
    prisma.category.update.mockResolvedValue(updated);

    await expect(service.update(categoryId, { name: 'Audio' })).resolves.toBe(
      updated,
    );
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: categoryId },
      data: { name: 'Audio' },
    });
  });

  it('rejects an update that reuses a name or slug', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.category.update.mockRejectedValue(knownRequestError('P2002'));

    await expect(service.update(categoryId, { slug: 'taken' })).rejects.toThrow(
      'Category name or slug already exists',
    );
  });

  it('deletes a category that has no products', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.product.count.mockResolvedValue(0);
    prisma.category.delete.mockResolvedValue(category);

    await expect(service.remove(categoryId)).resolves.toEqual({
      message: 'Category deleted successfully',
    });
    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: categoryId },
    });
  });

  it('rejects deleting a category that still has products', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.product.count.mockResolvedValue(2);

    await expect(service.remove(categoryId)).rejects.toThrow(
      'Cannot delete category while products reference it',
    );
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
