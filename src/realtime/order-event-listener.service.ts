import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { RealtimeGateway } from './realtime.gateway';

interface OrderStatusEvent {
  orderId: string;
  status: OrderStatus;
  updatedAt?: Date;
}

@Injectable()
export class OrderEventListenerService {
  private readonly logger = new Logger(OrderEventListenerService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  @OnEvent('order.status.updated')
  handleStatusUpdated(event: OrderStatusEvent): void {
    this.logger.log(
      `Broadcasting status update for order ${event.orderId}: ${event.status}`,
    );
    this.gateway.emitStatusUpdate(event.orderId, {
      orderId: event.orderId,
      status: event.status,
      updatedAt: event.updatedAt || new Date(),
    });
  }
}
