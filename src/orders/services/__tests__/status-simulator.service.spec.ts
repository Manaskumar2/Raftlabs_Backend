import { Test, TestingModule } from '@nestjs/testing';
import { StatusSimulatorService } from '../status-simulator.service';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderStatusPolicy } from '../../domain/order-status.policy';
import { OrderEventPublisher } from '../../../realtime/order-event-publisher';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const mockOrder = (status: OrderStatus) => ({
  id: 'order-1',
  customerName: 'John Doe',
  deliveryAddress: '123 Main St',
  phoneNumber: '+1234567890',
  status,
  totalAmount: new Decimal('598.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
});

describe('StatusSimulatorService', () => {
  let service: StatusSimulatorService;
  let orderRepository: Record<string, jest.Mock>;
  let eventPublisher: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.useFakeTimers();

    const mockOrderRepo = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const mockEventPub = {
      publishOrderCreated: jest.fn(),
      publishStatusUpdated: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(1000),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusSimulatorService,
        { provide: OrderRepository, useValue: mockOrderRepo },
        OrderStatusPolicy,
        { provide: OrderEventPublisher, useValue: mockEventPub },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StatusSimulatorService>(StatusSimulatorService);
    orderRepository = module.get(OrderRepository);
    eventPublisher = module.get(OrderEventPublisher);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startSimulation', () => {
    it('schedules three transitions', () => {
      service.startSimulation('order-1');

      // Verify no calls before timers fire
      expect(orderRepository.findById).not.toHaveBeenCalled();
    });

    it('transitions to PREPARING after first delay', async () => {
      const order = mockOrder(OrderStatus.ORDER_RECEIVED);
      const updatedOrder = mockOrder(OrderStatus.PREPARING);
      orderRepository.findById.mockResolvedValue(order);
      orderRepository.updateStatus.mockResolvedValue(updatedOrder);

      service.startSimulation('order-1');

      await jest.advanceTimersByTimeAsync(1000);

      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.PREPARING,
      );
      expect(eventPublisher.publishStatusUpdated).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.PREPARING,
        updatedOrder.updatedAt,
      );
    });

    it('skips transition if order was cancelled', async () => {
      const cancelledOrder = mockOrder(OrderStatus.CANCELLED);
      orderRepository.findById.mockResolvedValue(cancelledOrder);

      service.startSimulation('order-1');

      await jest.advanceTimersByTimeAsync(1000);

      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
      expect(orderRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelSimulation', () => {
    it('clears timers for a given order', async () => {
      service.startSimulation('order-1');
      service.cancelSimulation('order-1');

      await jest.advanceTimersByTimeAsync(3000);

      expect(orderRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('clears all active timers', async () => {
      service.startSimulation('order-1');
      service.startSimulation('order-2');

      service.onModuleDestroy();

      await jest.advanceTimersByTimeAsync(3000);

      expect(orderRepository.findById).not.toHaveBeenCalled();
    });
  });
});
