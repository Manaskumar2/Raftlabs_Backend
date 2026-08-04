import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusPolicy } from '../domain/order-status.policy';
import { OrderEventPublisher } from '../../realtime/order-event-publisher';

@Injectable()
export class StatusSimulatorService implements OnModuleDestroy {
  private readonly logger = new Logger(StatusSimulatorService.name);
  private readonly activeTimers = new Map<string, NodeJS.Timeout[]>();

  private readonly preparingDelay: number;
  private readonly deliveryDelay: number;
  private readonly deliveredDelay: number;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly statusPolicy: OrderStatusPolicy,
    private readonly eventPublisher: OrderEventPublisher,
    private readonly configService: ConfigService,
  ) {
    this.preparingDelay = this.configService.get<number>(
      'app.statusPreparingDelay',
      10000,
    );
    this.deliveryDelay = this.configService.get<number>(
      'app.statusDeliveryDelay',
      10000,
    );
    this.deliveredDelay = this.configService.get<number>(
      'app.statusDeliveredDelay',
      10000,
    );
  }

  startSimulation(orderId: string): void {
    this.logger.log(`Starting status simulation for order ${orderId}`);
    const timers: NodeJS.Timeout[] = [];

    // ORDER_RECEIVED -> PREPARING
    const timer1 = setTimeout(() => {
      this.transitionStatus(
        orderId,
        OrderStatus.ORDER_RECEIVED,
        OrderStatus.PREPARING,
      ).catch((err) => this.logger.error(`Error in timer1: ${err}`));
    }, this.preparingDelay);
    timers.push(timer1);

    // PREPARING -> OUT_FOR_DELIVERY
    const timer2 = setTimeout(() => {
      this.transitionStatus(
        orderId,
        OrderStatus.PREPARING,
        OrderStatus.OUT_FOR_DELIVERY,
      ).catch((err) => this.logger.error(`Error in timer2: ${err}`));
    }, this.preparingDelay + this.deliveryDelay);
    timers.push(timer2);

    // OUT_FOR_DELIVERY -> DELIVERED
    const timer3 = setTimeout(
      () => {
        this.transitionStatus(
          orderId,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
        )
          .then(() => {
            this.activeTimers.delete(orderId); // Clean up after final transition
          })
          .catch((err) => this.logger.error(`Error in timer3: ${err}`));
      },
      this.preparingDelay + this.deliveryDelay + this.deliveredDelay,
    );
    timers.push(timer3);

    this.activeTimers.set(orderId, timers);
  }

  cancelSimulation(orderId: string): void {
    const timers = this.activeTimers.get(orderId);
    if (timers) {
      timers.forEach((timer) => clearTimeout(timer));
      this.activeTimers.delete(orderId);
      this.logger.log(`Cancelled status simulation for order ${orderId}`);
    }
  }

  onModuleDestroy(): void {
    this.logger.log('Clearing all active status simulations...');
    for (const [orderId, timers] of this.activeTimers.entries()) {
      timers.forEach((timer) => clearTimeout(timer));
      this.logger.log(`Cleared timers for order ${orderId}`);
    }
    this.activeTimers.clear();
  }

  private async transitionStatus(
    orderId: string,
    expectedCurrentStatus: OrderStatus,
    targetStatus: OrderStatus,
  ): Promise<void> {
    try {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        this.logger.warn(
          `Order ${orderId} not found during simulation, skipping transition`,
        );
        return;
      }

      // Check if order is still in the expected state (might have been cancelled)
      if (order.status !== expectedCurrentStatus) {
        this.logger.warn(
          `Order ${orderId} is in ${order.status}, expected ${expectedCurrentStatus}. Skipping transition.`,
        );
        return;
      }

      // Validate the transition is still valid
      this.statusPolicy.validateTransition(order.status, targetStatus);

      const updatedOrder = await this.orderRepository.updateStatus(
        orderId,
        targetStatus,
        expectedCurrentStatus,
      );
      this.eventPublisher.publishStatusUpdated(
        orderId,
        targetStatus,
        updatedOrder.updatedAt,
      );
      this.logger.log(
        `Simulated transition for order ${orderId}: ${expectedCurrentStatus} -> ${targetStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to simulate status transition for order ${orderId}: ${(error as Error).message}`,
      );
    }
  }
}
