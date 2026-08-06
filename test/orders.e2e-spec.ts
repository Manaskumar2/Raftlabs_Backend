import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;

  const mockOrder = {
    id: 'RL-123456',
    customerName: 'E2E Test User',
    deliveryAddress: '123 E2E St',
    phoneNumber: '+1987654321',
    status: OrderStatus.ORDER_RECEIVED,
    totalAmount: '20.00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const mockOrdersService = {
    createOrder: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue({
      data: [mockOrder],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
    findById: jest.fn().mockResolvedValue(mockOrder),
    updateOrder: jest.fn().mockResolvedValue({ ...mockOrder, deliveryAddress: 'New Address' }),
    cancelOrder: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED }),
    updateOrderStatus: jest.fn().mockResolvedValue({ ...mockOrder, status: OrderStatus.PREPARING }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OrdersService)
      .useValue(mockOrdersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/orders (POST)', () => {
    it('should create an order with valid input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          customerName: 'E2E Test User',
          deliveryAddress: '123 E2E St',
          phoneNumber: '+1987654321',
          idempotencyKey: 'e2e-idempotency-key',
          items: [{ menuItemId: 'item-1', quantity: 2 }],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toEqual(mockOrder.id);
        });
    });

    it('should fail validation when phone number is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          customerName: 'E2E Test User',
          deliveryAddress: '123 E2E St',
          phoneNumber: 'invalid-phone', // Invalid phone format
          items: [{ menuItemId: 'item-1', quantity: 2 }],
        })
        .expect(400);
    });

    it('should fail validation when items array is empty', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          customerName: 'E2E Test User',
          deliveryAddress: '123 E2E St',
          phoneNumber: '+1987654321',
          items: [], // Validation should block empty arrays
        })
        .expect(400);
    });
  });

  describe('/api/v1/orders (GET)', () => {
    it('should fetch all orders with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta.page).toBe(1);
        });
    });
  });

  describe('/api/v1/orders/:id (GET)', () => {
    it('should fetch a single order by ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders/RL-123456')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual('RL-123456');
        });
    });

    it('should fail when ID is not a valid CUID or Premium ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders/invalid-id-format')
        .expect(400);
    });
  });

  describe('/api/v1/orders/:id (PATCH)', () => {
    it('should update an order delivery address', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/orders/RL-123456')
        .send({
          deliveryAddress: 'New Address',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.deliveryAddress).toEqual('New Address');
        });
    });
  });

  describe('/api/v1/orders/:id/cancel (DELETE)', () => {
    it('should cancel an order', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/orders/RL-123456')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toEqual(OrderStatus.CANCELLED);
        });
    });
  });

  describe('/api/v1/orders/:id/status (PATCH)', () => {
    it('should update order status', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/orders/RL-123456/status')
        .send({
          status: OrderStatus.PREPARING,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toEqual(OrderStatus.PREPARING);
        });
    });

    it('should fail if invalid status is provided', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/orders/RL-123456/status')
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });
  });
});
