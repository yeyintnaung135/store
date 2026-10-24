import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AdminOrdersService } from './admin-orders.service.js';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto.js';
import { UpdateOrderStatusDto } from './dto/admin-order-status.dto.js';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description:
      'Retrieve paginated orders. Supports search and status filtering. Admin only.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'ORD-2026',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin role is required.',
  })
  findAll(@Query() query: AdminOrdersQueryDto) {
    return this.adminOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieve one order by its UUID. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminOrdersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Change order status according to the allowed status transitions. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateOrderStatusDto,
    examples: {
      confirmOrder: {
        summary: 'Confirm an order',
        value: {
          status: 'CONFIRMED',
        },
      },
      processOrder: {
        summary: 'Start processing',
        value: {
          status: 'PROCESSING',
        },
      },
      shipOrder: {
        summary: 'Ship an order',
        value: {
          status: 'SHIPPED',
        },
      },
      deliverOrder: {
        summary: 'Mark as delivered',
        value: {
          status: 'DELIVERED',
        },
      },
      cancelOrder: {
        summary: 'Cancel an order',
        value: {
          status: 'CANCELLED',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminOrdersService.updateStatus(id, dto);
  }
}
