import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProductExportService } from './product-export.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../generated/prisma/enums.js';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

@ApiTags('Admin - Product Export')
@ApiBearerAuth()
@Controller('admin/products/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductExportController {
  constructor(private readonly productExportService: ProductExportService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new BadRequestException('Authenticated user ID is missing.');
    }

    return userId;
  }

  // POST /admin/products/export
  @Post()
  @ApiOperation({
    summary: 'Queue product Excel export',
    description:
      'Queues a background job to export all products to an Excel file. ADMIN only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product export job queued successfully.',
    schema: {
      example: {
        jobId: '7c7b6f89-01a2-4e83-9bd0-123456789abc',
        status: 'waiting',
        message: 'Product export job queued successfully.',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Admin role required.' })
  async enqueue(@Req() req: AuthenticatedRequest) {
    return this.productExportService.enqueue(this.getUserId(req));
  }

  // GET /admin/products/export/:jobId
  @Get(':jobId')
  @ApiOperation({
    summary: 'Get product export job status',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Export job ID returned by the enqueue endpoint.',
    example: '7c7b6f89-01a2-4e83-9bd0-123456789abc',
  })
  @ApiResponse({
    status: 200,
    description: 'Export job status retrieved successfully.',
    schema: {
      example: {
        jobId: '7c7b6f89-01a2-4e83-9bd0-123456789abc',
        status: 'completed',
        progress: 100,
        rowCount: 250,
        createdAt: '2026-10-26T03:00:00.000Z',
        finishedAt: '2026-10-26T03:00:05.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Not your export job.' })
  @ApiResponse({ status: 404, description: 'Export job not found.' })
  async status(
    @Param('jobId') jobId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productExportService.getStatus(jobId, this.getUserId(req));
  }

  // GET /admin/products/export/:jobId/download
  @Get(':jobId/download')
  @ApiOperation({
    summary: 'Download exported product Excel file',
    description:
      'Downloads the generated Excel file after the export job has completed.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Completed export job ID.',
    example: '7c7b6f89-01a2-4e83-9bd0-123456789abc',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file downloaded successfully.',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Admin role required or job access denied.',
  })
  @ApiResponse({
    status: 404,
    description: 'Export file is not ready or was not found.',
  })
  async download(
    @Param('jobId') jobId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.productExportService.getDownloadFile(
      jobId,
      this.getUserId(req),
    );

    res.download(filePath, 'products.xlsx', (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({
          message: 'Failed to download Excel file.',
        });
      }
    });
  }
}
