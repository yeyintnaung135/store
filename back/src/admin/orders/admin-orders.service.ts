import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrderStatus, Prisma } from '../../generated/prisma/client.js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto.js';
import { UpdateOrderStatusDto } from './dto/admin-order-status.dto.js';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminOrdersQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (search) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          search,
        );

      where.OR = [
        ...(isUuid
          ? [
              {
                id: {
                  equals: search,
                },
              },
            ]
          : []),
        {
          orderNumber: {
            contains: search,
          },
        },
        {
          user: {
            is: {
              email: {
                contains: search,
              },
            },
          },
        },
        {
          user: {
            is: {
              phone: {
                contains: search,
              },
            },
          },
        },
        {
          user: {
            is: {
              name: {
                contains: search,
              },
            },
          },
        },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
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

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
      };

      if (!allowedTransitions[order.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change order status from ${order.status} to ${dto.status}`,
        );
      }

      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: order.status,
        },
        data: {
          status: dto.status,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestException(
          'Order status changed concurrently. Please retry.',
        );
      }

      return tx.order.findUnique({
        where: {
          id: orderId,
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
    });
  }
}
