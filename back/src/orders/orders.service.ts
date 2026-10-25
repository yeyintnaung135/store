import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

type CreateOrderInput = {
  items: CreateOrderItemInput[];
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an order for the authenticated user.
   * userId must come from JWT, never from the request body.
   */
  async create(userId: string, dto: CreateOrderInput) {
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // Validate input and combine duplicate product IDs.
    const quantityByProduct = new Map<string, number>();

    for (const item of dto.items) {
      if (!item.productId) {
        throw new BadRequestException('Product ID is required.');
      }

      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException(
          'Each product quantity must be a positive integer.',
        );
      }

      const nextQuantity =
        (quantityByProduct.get(item.productId) ?? 0) + item.quantity;

      if (!Number.isSafeInteger(nextQuantity)) {
        throw new BadRequestException('Product quantity is too large.');
      }

      quantityByProduct.set(item.productId, nextQuantity);
    }

    const productIds = [...quantityByProduct.keys()];

    return this.prisma.$transaction(async (tx) => {
      // Fetch prices and names from the database, not the frontend.
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products could not be found.');
      }

      const productById = new Map(
        products.map((product) => [product.id, product]),
      );

      let total = new Prisma.Decimal(0);

      const orderItems = productIds.map((productId) => {
        const product = productById.get(productId);

        if (!product) {
          throw new NotFoundException(`Product ${productId} not found.`);
        }

        const quantity = quantityByProduct.get(productId)!;
        const unitPrice = new Prisma.Decimal(product.price);
        const subtotal = unitPrice.mul(quantity);

        total = total.add(subtotal);

        return {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity,
          subtotal,
        };
      });

      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${randomUUID()}`,
          userId,
          total,
          status: 'PENDING',
          items: {
            create: orderItems,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: true,
        },
      });

      return order;
    });
  }

  /**
   * Return only the orders belonging to the authenticated user.
   */
  async findMyOrders(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 10));

    const where: Prisma.OrderWhereInput = {
      userId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Find one order, enforcing ownership in the database query.
   */
  async findOneForUser(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }
}
