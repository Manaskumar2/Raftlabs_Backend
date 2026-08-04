import { OrderStatus } from '@prisma/client';

export abstract class OrderEventPublisher {
  abstract publishOrderCreated(order: {
    id: string;
    status: OrderStatus;
  }): void;
  abstract publishStatusUpdated(
    orderId: string,
    status: OrderStatus,
    updatedAt: Date,
  ): void;
}
