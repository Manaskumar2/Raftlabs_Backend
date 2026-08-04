import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 422, description: 'Menu item unavailable' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.createOrder(createOrderDto, user.userId);
    return OrderResponseDto.fromEntity(order);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of orders' })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: { userId: string; role: Role },
  ) {
    const result = await this.ordersService.findAll({
      ...query,
      userId: user.role === Role.CUSTOMER ? user.userId : undefined,
    } as any);
    return {
      data: result.data.map((order) => OrderResponseDto.fromEntity(order)),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id, user);
    return OrderResponseDto.fromEntity(order);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order details (only when ORDER_RECEIVED)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order updated',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order cannot be modified' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updateOrder(id, updateOrderDto, user);
    return OrderResponseDto.fromEntity(order);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel an order (only from ORDER_RECEIVED or PREPARING)',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order cannot be cancelled' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id, user);
    return OrderResponseDto.fromEntity(order);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin operation)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updateOrderStatus(id, dto);
    return OrderResponseDto.fromEntity(order);
  }
}
