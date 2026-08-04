import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { OrderEventPublisher } from './order-event-publisher';

@Injectable()
export class EventEmitterPublisher extends OrderEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  publishOrderCreated(order: { id: string; status: OrderStatus }): void {
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      status: order.status,
    });
  }

  publishStatusUpdated(
    orderId: string,
    status: OrderStatus,
    updatedAt: Date,
  ): void {
    this.eventEmitter.emit('order.status.updated', {
      orderId,
      status,
      updatedAt,
    });
  }
}
