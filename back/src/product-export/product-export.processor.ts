import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import ExcelJS from 'exceljs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  PRODUCT_EXPORT_QUEUE,
  type ProductExportJobData,
  type ProductExportJobResult,
} from './product-export.service.js';

@Processor(PRODUCT_EXPORT_QUEUE, { concurrency: 1 })
@Injectable()
export class ProductExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductExportProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<ProductExportJobData>,
  ): Promise<ProductExportJobResult> {
    if (job.name !== 'export-all-products') {
      throw new Error(`Unsupported job: ${job.name}`);
    }

    this.logger.log(`Starting product export: ${job.id}`);

    // Fetch products from PostgreSQL through Prisma.
    const products = await this.prisma.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    await job.updateProgress(10);

    // Create Excel workbook.
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Store Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Products');

    sheet.columns = [
      { header: 'Product ID', key: 'id', width: 38 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Category', key: 'category', width: 22 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Photo URL', key: 'photoUrl', width: 45 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    // Style the header.
    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: 'middle' };
    header.height = 22;

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    sheet.autoFilter = {
      from: 'A1',
      to: 'J1',
    };

    // Add product data.
    const total = products.length;

    for (let i = 0; i < total; i++) {
      const product = products[i];

      sheet.addRow({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category.name,
        price: Number(product.price),
        stock: product.stock,
        status: product.status,
        description: product.description ?? '',
        photoUrl: product.photoUrl ?? '',
        createdAt: product.createdAt.toISOString(),
      });

      // Report progress periodically.
      if (i % 100 === 0 || i === total - 1) {
        const progress =
          total === 0 ? 90 : 10 + Math.floor(((i + 1) / total) * 80);

        await job.updateProgress(progress);
      }
    }

    sheet.getColumn('price').numFmt = '#,##0.00';

    // Save the Excel file locally.
    const outputDirectory = path.resolve(
      process.env.PRODUCT_EXPORT_DIR ?? 'storage/exports',
    );

    await mkdir(outputDirectory, {
      recursive: true,
    });

    const fileName = `${job.id}.xlsx`;
    const filePath = path.join(outputDirectory, fileName);

    const buffer = await workbook.xlsx.writeBuffer();

    await writeFile(filePath, Buffer.from(buffer));

    await job.updateProgress(100);

    this.logger.log(`Product export completed: ${job.id} (${total} products)`);

    return {
      fileName,
      rowCount: total,
    };
  }
}
