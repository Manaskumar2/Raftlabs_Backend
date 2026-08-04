import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OrderRepository,
  CreateOrderData,
  UpdateOrderData,
  FindAllParams,
  PaginatedResult,
  OrderWithItems,
} from './order.repository';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderData): Promise<OrderWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          deliveryAddress: data.deliveryAddress,
          phoneNumber: data.phoneNumber,
          totalAmount: data.totalAmount,
          userId: data.userId,
          status: OrderStatus.ORDER_RECEIVED,
        },
      });

      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: { include: { menuItem: true } } },
      });
    });
  }

  async findAll(
    params: FindAllParams,
  ): Promise<PaginatedResult<OrderWithItems>> {
    const { page, limit, status, userId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { menuItem: true } } },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async update(id: string, data: UpdateOrderData): Promise<OrderWithItems> {
    return this.prisma.order.update({
      where: { id },
      data: {
        customerName: data.customerName,
        deliveryAddress: data.deliveryAddress,
        phoneNumber: data.phoneNumber,
      },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { menuItem: true } } },
    });
  }
}
