import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrderOwnerGuard } from '../auth/order-owner.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Please log in first.');
    }

    return userId;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Creates an order for the authenticated user. Product prices and order totals are calculated by the server.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order items or quantity.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Login is required.',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more products were not found.',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    const userId = this.getUserId(req);

    return this.ordersService.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get my orders',
    description: 'Returns only the orders belonging to the logged-in user.',
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
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Login is required.',
  })
  findMyOrders(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getUserId(req);

    return this.ordersService.findMyOrders(
      userId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id')
  @UseGuards(OrderOwnerGuard)
  @ApiOperation({
    summary: 'Get order details',
    description: 'Only the owner of the order can access its details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Login is required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found or does not belong to this user.',
  })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);

    return this.ordersService.findOneForUser(id, userId);
  }
}
