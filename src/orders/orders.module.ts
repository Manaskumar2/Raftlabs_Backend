import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRepository } from './repositories/order.repository';
import { PrismaOrderRepository } from './repositories/prisma-order.repository';
import { OrderStatusPolicy } from './domain/order-status.policy';
import { PriceCalculator } from './domain/price-calculator';
import { StatusSimulatorService } from './services/status-simulator.service';
import { MenuModule } from '../menu/menu.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [MenuModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: OrderRepository,
      useClass: PrismaOrderRepository,
    },
    OrderStatusPolicy,
    PriceCalculator,
    StatusSimulatorService,
  ],
})
export class OrdersModule {}
