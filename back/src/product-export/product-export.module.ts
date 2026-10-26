import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ProductExportController } from './product-export.controller.js';
import { ProductExportService } from './product-export.service.js';
import { ProductExportProcessor } from './product-export.processor.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'product-export',
    }),
    AuthModule,
  ],
  controllers: [ProductExportController],
  providers: [ProductExportService, ProductExportProcessor, PrismaService],
})
export class ProductExportModule {}
