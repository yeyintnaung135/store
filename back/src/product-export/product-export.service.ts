import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const PRODUCT_EXPORT_QUEUE = 'product-export';

export type ProductExportJobData = {
  requestedBy: string;
};

export type ProductExportJobResult = {
  fileName: string;
  rowCount: number;
};

@Injectable()
export class ProductExportService {
  constructor(
    @InjectQueue(PRODUCT_EXPORT_QUEUE)
    private readonly queue: Queue<ProductExportJobData>,
  ) {}

  // 1. Add export job to BullMQ
  async enqueue(userId: string) {
    const jobId = randomUUID();

    const job = await this.queue.add(
      'export-all-products',
      {
        requestedBy: userId,
      },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 7 * 24 * 60 * 60,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      },
    );

    return {
      jobId: job.id,
      status: 'waiting',
      message: 'Product export job queued successfully.',
    };
  }

  // 2. Find job and verify ownership
  private async getOwnedJob(
    jobId: string,
    userId: string,
  ): Promise<Job<ProductExportJobData, ProductExportJobResult>> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Export job not found or expired.');
    }

    if (job.data.requestedBy !== userId) {
      throw new ForbiddenException('You cannot access this export job.');
    }

    return job as Job<ProductExportJobData, ProductExportJobResult>;
  }

  // 3. Get job status
  async getStatus(jobId: string, userId: string) {
    const job = await this.getOwnedJob(jobId, userId);
    const state = await job.getState();

    return {
      jobId: job.id,
      status: state,
      progress: job.progress,
      rowCount: state === 'completed' ? job.returnvalue?.rowCount : undefined,
      failedReason: state === 'failed' ? job.failedReason : undefined,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : null,
    };
  }

  // 4. Get the generated Excel file path
  async getDownloadFile(jobId: string, userId: string): Promise<string> {
    const job = await this.getOwnedJob(jobId, userId);
    const state = await job.getState();

    if (state !== 'completed') {
      throw new NotFoundException(
        'Excel file is not ready yet. Check the job status.',
      );
    }

    const fileName = job.returnvalue?.fileName;

    // Only accept the expected generated filename.
    if (fileName !== `${jobId}.xlsx`) {
      throw new NotFoundException('Export file information is invalid.');
    }

    const outputDirectory = path.resolve(
      process.env.PRODUCT_EXPORT_DIR ?? 'storage/exports',
    );

    const filePath = path.resolve(outputDirectory, fileName);

    // Prevent path traversal.
    if (path.dirname(filePath) !== outputDirectory) {
      throw new NotFoundException('Invalid export file path.');
    }

    if (!existsSync(filePath)) {
      throw new NotFoundException('Export file is no longer available.');
    }

    return filePath;
  }
}
