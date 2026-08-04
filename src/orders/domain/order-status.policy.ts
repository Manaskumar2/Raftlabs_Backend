import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { InvalidStatusTransitionException } from '../exceptions/invalid-status-transition.exception';

@Injectable()
export class OrderStatusPolicy {
  private static readonly TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.ORDER_RECEIVED]: [
      OrderStatus.PREPARING,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PREPARING]: [
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  validateTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = OrderStatusPolicy.TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new InvalidStatusTransitionException(from, to);
    }
  }

  canCancel(status: OrderStatus): boolean {
    return (
      status === OrderStatus.ORDER_RECEIVED || status === OrderStatus.PREPARING
    );
  }

  canModify(status: OrderStatus): boolean {
    return status === OrderStatus.ORDER_RECEIVED;
  }

  getNextStatus(current: OrderStatus): OrderStatus | null {
    const allowed = OrderStatusPolicy.TRANSITIONS[current];
    const next = allowed.find((s) => s !== OrderStatus.CANCELLED);
    return next || null;
  }

  isTerminal(status: OrderStatus): boolean {
    return OrderStatusPolicy.TRANSITIONS[status].length === 0;
  }
}
