import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrderOwnerGuard } from '../auth/order-owner.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderOwnerGuard],
})
export class OrdersModule {}
