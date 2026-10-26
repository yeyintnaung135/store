import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductPhotoStorage } from './product-photo.storage.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisCacheModule } from '../admin/cache/redis-cache.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, RedisCacheModule, AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductPhotoStorage],
  exports: [ProductsService],
})
export class ProductsModule {}
