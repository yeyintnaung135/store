import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { AdminOrdersModule } from './admin/orders/admin-orders.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { BullModule } from '@nestjs/bullmq';
import { ProductExportModule } from './product-export/product-export.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    HealthModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    AdminOrdersModule,
    OrdersModule,
    ProductExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
