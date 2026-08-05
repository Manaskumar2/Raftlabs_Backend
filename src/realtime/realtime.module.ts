import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';
import { OrderEventPublisher } from './order-event-publisher';
import { EventEmitterPublisher } from './event-emitter-publisher';
import { OrderEventListenerService } from './order-event-listener.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    RealtimeGateway,
    {
      provide: OrderEventPublisher,
      useClass: EventEmitterPublisher,
    },
    OrderEventListenerService,
  ],
  exports: [OrderEventPublisher],
})
export class RealtimeModule {}
