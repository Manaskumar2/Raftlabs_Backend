import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

import { MenuService } from '../menu/menu.service';
import {
  OrderRepository,
  OrderWithItems,
} from './repositories/order.repository';
import { PriceCalculator } from './domain/price-calculator';
import { OrderStatusPolicy } from './domain/order-status.policy';
import { OrderEventPublisher } from '../realtime/order-event-publisher';
import { StatusSimulatorService } from './services/status-simulator.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  OrderNotFoundException,
  MenuItemNotFoundException,
  MenuItemUnavailableException,
  OrderCannotBeModifiedException,
  OrderCannotBeCancelledException,
} from './exceptions';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly menuService: MenuService,
    private readonly priceCalculator: PriceCalculator,
    private readonly statusPolicy: OrderStatusPolicy,
    private readonly eventPublisher: OrderEventPublisher,
    private readonly statusSimulatorService: StatusSimulatorService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<OrderWithItems> {
    // 0. Check for Idempotency
    if (dto.idempotencyKey) {
      const existingOrder = await this.orderRepository.findByIdempotencyKey(dto.idempotencyKey);
      if (existingOrder) {
        this.logger.log(`Idempotent order request matched: ${existingOrder.id}`);
        return existingOrder;
      }
    }

    // 1. Merge duplicate items
    const mergedItemsMap = new Map<string, number>();
    for (const item of dto.items) {
      const currentQty = mergedItemsMap.get(item.menuItemId) || 0;
      mergedItemsMap.set(item.menuItemId, currentQty + item.quantity);
    }

    // 2. Extract unique menuItemIds
    const uniqueMenuItemIds = Array.from(mergedItemsMap.keys());

    // 3. Call menuService.findByIds
    const menuItems = await this.menuService.findByIds(uniqueMenuItemIds);

    // 4. Validate ALL items exist
    const foundItemIds = new Set(menuItems.map((item) => item.id));
    const missingItemIds = uniqueMenuItemIds.filter(
      (id) => !foundItemIds.has(id),
    );
    if (missingItemIds.length > 0) {
      throw new MenuItemNotFoundException(missingItemIds);
    }

    // 5. Validate ALL items are available
    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      throw new MenuItemUnavailableException(
        unavailableItems.map((item) => item.name),
      );
    }

    // 6. Calculate pricing
    const orderItemsData = menuItems.map((menuItem) => {
      const quantity = mergedItemsMap.get(menuItem.id)!;
      const subtotal = this.priceCalculator.calculateItemSubtotal(
        menuItem.price,
        quantity,
      );
      return {
        menuItemId: menuItem.id,
        quantity,
        unitPrice: menuItem.price,
        subtotal,
      };
    });

    const totalAmount = this.priceCalculator.calculateTotalAmount(
      orderItemsData.map((item) => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    );

    // 7. Generate Premium Order ID
    const generatedId = `RL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 8. Call orderRepository.create
    const createdOrder = await this.orderRepository.create({
      id: generatedId,
      customerName: dto.customerName,
      deliveryAddress: dto.deliveryAddress,
      phoneNumber: dto.phoneNumber,
      idempotencyKey: dto.idempotencyKey,
      totalAmount,
      items: orderItemsData,
    });

    // 9. Publish ORDER_CREATED event
    this.eventPublisher.publishOrderCreated(createdOrder);

    // 10. Start status simulation
    this.statusSimulatorService.startSimulation(createdOrder.id);

    // 11. Log order creation
    this.logger.log(
      `Order created: ${createdOrder.id} with total amount: ${totalAmount.toString()}`,
    );

    // 12. Return the created order
    return createdOrder;
  }

  async findAll(query: OrderQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.orderRepository.findAll({
      page,
      limit,
      status: query.status,
      phoneNumber: query.phoneNumber,
      search: query.search,
    });
  }

  async findById(id: string, phoneNumber?: string): Promise<OrderWithItems> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundException(id);
    }
    if (phoneNumber && order.phoneNumber !== phoneNumber) {
      throw new ForbiddenException('You do not have permission to access this order');
    }
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto, phoneNumber?: string): Promise<OrderWithItems> {
    const order = await this.findById(id, phoneNumber);

    if (!this.statusPolicy.canModify(order.status)) {
      throw new OrderCannotBeModifiedException(order.status);
    }

    const updatedOrder = await this.orderRepository.update(id, dto);
    this.logger.log(`Order updated: ${id}`);

    return updatedOrder;
  }

  async cancelOrder(id: string, phoneNumber?: string): Promise<OrderWithItems> {
    const order = await this.findById(id, phoneNumber);

    if (!this.statusPolicy.canCancel(order.status)) {
      throw new OrderCannotBeCancelledException(order.status);
    }

    this.statusSimulatorService.cancelSimulation(id);

    const cancelledOrder = await this.orderRepository.updateStatus(
      id,
      OrderStatus.CANCELLED,
      order.status,
    );

    this.eventPublisher.publishStatusUpdated(
      id,
      OrderStatus.CANCELLED,
      cancelledOrder.updatedAt,
    );

    this.logger.log(`Order cancelled: ${id}`);

    return cancelledOrder;
  }

  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderWithItems> {
    const order = await this.findById(id);

    this.statusPolicy.validateTransition(order.status, dto.status);

    const updatedOrder = await this.orderRepository.updateStatus(
      id,
      dto.status,
      order.status,
    );

    this.eventPublisher.publishStatusUpdated(
      id,
      dto.status,
      updatedOrder.updatedAt,
    );

    this.logger.log(`Order status updated: ${id} to ${dto.status}`);

    return updatedOrder;
  }
}
