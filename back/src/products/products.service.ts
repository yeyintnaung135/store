import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductPhotoStorage } from './product-photo.storage.js';
import { RedisCacheService } from '../admin/cache/redis-cache.service.js';

@Injectable()
export class ProductsService {
  private readonly cachePrefix = 'admin:products:list:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly photos: ProductPhotoStorage,
    private readonly cache: RedisCacheService,
  ) {}

  private async invalidateProductCache(): Promise<void> {
    await this.cache.delByPrefix(this.cachePrefix);
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          price: dto.price,
          stock: dto.stock ?? 0,
          categoryId: dto.categoryId,
          photoUrl: dto.photoUrl ? this.photos.save(dto.photoUrl) : null,
          status: dto.status ?? ProductStatus.DRAFT,
        },
        include: { category: true },
      });

      await this.invalidateProductCache();
      return product;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug already exists');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }

  async findAll(page = 1, limit = 10, search?: string, categoryId?: string) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const safeSearch = search?.trim() ?? '';

    const cacheKey =
      this.cachePrefix +
      JSON.stringify({
        page: safePage,
        limit: safeLimit,
        search: safeSearch,
        categoryId: categoryId ?? null,
      });

    const cached = await this.cache.get<{
      data: unknown[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: Prisma.ProductWhereInput = {
      ...(safeSearch
        ? {
            OR: [
              {
                name: {
                  contains: safeSearch,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: safeSearch,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: items,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {}),
          ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.photoUrl !== undefined
            ? {
                photoUrl: dto.photoUrl ? this.photos.save(dto.photoUrl) : null,
              }
            : {}),
        },
        include: { category: true },
      });

      await this.invalidateProductCache();
      return product;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug already exists');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.product.delete({ where: { id } });

      await this.invalidateProductCache();

      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete product because it is referenced by existing records',
        );
      }

      throw error;
    }
  }
}
