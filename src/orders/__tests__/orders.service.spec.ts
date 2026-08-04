import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { OrderRepository } from '../repositories/order.repository';
import { MenuService } from '../../menu/menu.service';
import { PriceCalculator } from '../domain/price-calculator';
import { OrderStatusPolicy } from '../domain/order-status.policy';
import { OrderEventPublisher } from '../../realtime/order-event-publisher';
import { StatusSimulatorService } from '../services/status-simulator.service';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { MenuItemNotFoundException } from '../exceptions/menu-item-not-found.exception';
import { MenuItemUnavailableException } from '../exceptions/menu-item-unavailable.exception';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { OrderCannotBeModifiedException } from '../exceptions/order-cannot-be-modified.exception';
import { OrderCannotBeCancelledException } from '../exceptions/order-cannot-be-cancelled.exception';

const mockMenuItem = {
  id: 'menu-1',
  name: 'Test Pizza',
  description: 'A test pizza',
  price: new Decimal('299.00'),
  imageUrl: 'http://example.com/pizza.jpg',
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [],
};

const mockOrderWithItems = {
  id: 'order-1',
  customerName: 'John Doe',
  deliveryAddress: '123 Main St',
  phoneNumber: '+1234567890',
  userId: 'user-1',
  status: OrderStatus.ORDER_RECEIVED,
  totalAmount: new Decimal('598.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-1',
      menuItemId: 'menu-1',
      quantity: 2,
      unitPrice: new Decimal('299.00'),
      subtotal: new Decimal('598.00'),
      menuItem: { ...mockMenuItem },
    },
  ],
};

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Record<string, jest.Mock>;
  let menuService: Record<string, jest.Mock>;
  let eventPublisher: Record<string, jest.Mock>;
  let statusSimulator: Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockOrderRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockMenuSvc = {
      findByIds: jest.fn(),
    };

    const mockEventPub = {
      publishOrderCreated: jest.fn(),
      publishStatusUpdated: jest.fn(),
    };

    const mockSimulator = {
      startSimulation: jest.fn(),
      cancelSimulation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrderRepository, useValue: mockOrderRepo },
        { provide: MenuService, useValue: mockMenuSvc },
        PriceCalculator,
        OrderStatusPolicy,
        { provide: OrderEventPublisher, useValue: mockEventPub },
        { provide: StatusSimulatorService, useValue: mockSimulator },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(OrderRepository);
    menuService = module.get(MenuService);
    eventPublisher = module.get(OrderEventPublisher);
    statusSimulator = module.get(StatusSimulatorService);
  });

  describe('createOrder', () => {
    const createDto = {
      customerName: 'John Doe',
      deliveryAddress: '123 Main St',
      phoneNumber: '+1234567890',
      items: [{ menuItemId: 'menu-1', quantity: 2 }],
    };

    it('creates order successfully with correct pricing', async () => {
      menuService.findByIds.mockResolvedValue([mockMenuItem]);
      orderRepository.create.mockResolvedValue(mockOrderWithItems);

      const result = await service.createOrder(createDto, 'user-1');

      expect(menuService.findByIds).toHaveBeenCalledWith(['menu-1']);
      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          totalAmount: expect.any(Decimal),
          items: expect.arrayContaining([
            expect.objectContaining({
              menuItemId: 'menu-1',
              quantity: 2,
              unitPrice: new Decimal('299.00'),
            }),
          ]),
        }),
      );
      expect(eventPublisher.publishOrderCreated).toHaveBeenCalledWith(
        mockOrderWithItems,
      );
      expect(statusSimulator.startSimulation).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockOrderWithItems);
    });

    it('merges duplicate menu items', async () => {
      menuService.findByIds.mockResolvedValue([mockMenuItem]);
      orderRepository.create.mockResolvedValue(mockOrderWithItems);

      const duplicateDto = {
        ...createDto,
        items: [
          { menuItemId: 'menu-1', quantity: 1 },
          { menuItemId: 'menu-1', quantity: 2 },
        ],
      };

      await service.createOrder(duplicateDto, 'user-1');

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ menuItemId: 'menu-1', quantity: 3 }),
          ]),
        }),
      );
    });

    it('throws MenuItemNotFoundException when item not found', async () => {
      menuService.findByIds.mockResolvedValue([]);

      const dto = {
        ...createDto,
        items: [{ menuItemId: 'invalid-id', quantity: 1 }],
      };

      await expect(service.createOrder(dto, 'user-1')).rejects.toThrow(
        MenuItemNotFoundException,
      );
    });

    it('throws MenuItemUnavailableException when item unavailable', async () => {
      const unavailableItem = { ...mockMenuItem, isAvailable: false };
      menuService.findByIds.mockResolvedValue([unavailableItem]);

      await expect(service.createOrder(createDto, 'user-1')).rejects.toThrow(
        MenuItemUnavailableException,
      );
    });

    it('calculates total server-side correctly', async () => {
      menuService.findByIds.mockResolvedValue([mockMenuItem]);
      orderRepository.create.mockResolvedValue(mockOrderWithItems);

      await service.createOrder(createDto, 'user-1');

      // Verify the total amount passed to create is computed by PriceCalculator
      const createCall = orderRepository.create.mock.calls[0][0];
      expect(createCall.totalAmount).toBeInstanceOf(Decimal);
      expect(createCall.totalAmount.toString()).toBe('598');
    });
  });

  describe('findById', () => {
    it('returns order when found', async () => {
      orderRepository.findById.mockResolvedValue(mockOrderWithItems);

      const result = await service.findById('order-1');

      expect(result).toEqual(mockOrderWithItems);
      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('throws OrderNotFoundException when not found', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        OrderNotFoundException,
      );
    });
  });

  describe('updateOrder', () => {
    it('updates order when ORDER_RECEIVED', async () => {
      orderRepository.findById.mockResolvedValue(mockOrderWithItems);
      const updatedOrder = {
        ...mockOrderWithItems,
        deliveryAddress: 'New Address',
      };
      orderRepository.update.mockResolvedValue(updatedOrder);

      const result = await service.updateOrder('order-1', { deliveryAddress: 'New Address' }, { userId: 'user-1', role: 'CUSTOMER' as any });

      expect(orderRepository.update).toHaveBeenCalledWith('order-1', {
        deliveryAddress: 'New Address',
      });
      expect(result.deliveryAddress).toBe('New Address');
    });

    it('throws OrderCannotBeModifiedException when PREPARING', async () => {
      const preparingOrder = {
        ...mockOrderWithItems,
        status: OrderStatus.PREPARING,
      };
      orderRepository.findById.mockResolvedValue(preparingOrder);

      await expect(
        service.updateOrder('order-1', { deliveryAddress: 'New Address' }, { userId: 'user-1', role: 'CUSTOMER' as any }),
      ).rejects.toThrow(OrderCannotBeModifiedException);
    });
  });

  describe('cancelOrder', () => {
    it('cancels order from ORDER_RECEIVED', async () => {
      orderRepository.findById.mockResolvedValue(mockOrderWithItems);
      const cancelledOrder = {
        ...mockOrderWithItems,
        status: OrderStatus.CANCELLED,
        updatedAt: new Date(),
      };
      orderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('order-1', { userId: 'user-1', role: 'CUSTOMER' as any });

      expect(statusSimulator.cancelSimulation).toHaveBeenCalledWith('order-1');
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CANCELLED,
        OrderStatus.ORDER_RECEIVED,
      );
      expect(eventPublisher.publishStatusUpdated).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CANCELLED,
        cancelledOrder.updatedAt,
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('cancels order from PREPARING', async () => {
      const preparingOrder = {
        ...mockOrderWithItems,
        status: OrderStatus.PREPARING,
      };
      orderRepository.findById.mockResolvedValue(preparingOrder);
      const cancelledOrder = {
        ...preparingOrder,
        status: OrderStatus.CANCELLED,
        updatedAt: new Date(),
      };
      orderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('order-1', { userId: 'user-1', role: 'CUSTOMER' as any });

      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CANCELLED,
        OrderStatus.PREPARING,
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('throws OrderCannotBeCancelledException when DELIVERED', async () => {
      const deliveredOrder = {
        ...mockOrderWithItems,
        status: OrderStatus.DELIVERED,
      };
      orderRepository.findById.mockResolvedValue(deliveredOrder);

      await expect(service.cancelOrder('order-1', { userId: 'user-1', role: 'CUSTOMER' as any })).rejects.toThrow(
        OrderCannotBeCancelledException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('valid transition succeeds', async () => {
      orderRepository.findById.mockResolvedValue(mockOrderWithItems);
      const updatedOrder = {
        ...mockOrderWithItems,
        status: OrderStatus.PREPARING,
        updatedAt: new Date(),
      };
      orderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.PREPARING,
      });

      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.PREPARING,
        OrderStatus.ORDER_RECEIVED,
      );
      expect(eventPublisher.publishStatusUpdated).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.PREPARING,
        updatedOrder.updatedAt,
      );
      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('invalid transition throws', async () => {
      orderRepository.findById.mockResolvedValue(mockOrderWithItems);

      await expect(
        service.updateOrderStatus('order-1', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow();
    });
  });
});
