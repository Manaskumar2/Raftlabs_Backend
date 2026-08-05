import { Injectable, ConflictException } from '@nestjs/common';
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
          idempotencyKey: data.idempotencyKey,
          totalAmount: data.totalAmount,
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
    const { page, limit, status, phoneNumber } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (phoneNumber) where.phoneNumber = phoneNumber;

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

  async findByIdempotencyKey(key: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { idempotencyKey: key },
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

  async updateStatus(id: string, status: OrderStatus, expectedCurrentStatus?: OrderStatus): Promise<OrderWithItems> {
    if (expectedCurrentStatus) {
      const result = await this.prisma.order.updateMany({
        where: { id, status: expectedCurrentStatus },
        data: { status },
      });

      if (result.count === 0) {
        throw new ConflictException(`Race condition detected or order not found: unable to update order ${id} from ${expectedCurrentStatus} to ${status}`);
      }
    } else {
      await this.prisma.order.update({
        where: { id },
        data: { status },
      });
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: { include: { menuItem: true } } },
    });
  }
}
