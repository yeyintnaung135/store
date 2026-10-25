import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

@Injectable()
export class OrderOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.user?.id ?? request.user?.sub;
    const orderId = request.params['id'];

    if (!userId) {
      throw new UnauthorizedException('Please log in first.');
    }

    if (!orderId) {
      throw new NotFoundException('Order not found.');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId as string,
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return true;
  }
}
