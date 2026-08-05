import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Order, OrderItem, MenuItem } from '@prisma/client';

export type OrderWithItems = Order & {
  items: (OrderItem & {
    menuItem: MenuItem;
  })[];
};

export interface CreateOrderData {
  customerName: string;
  deliveryAddress: string;
  phoneNumber: string;
  idempotencyKey: string;
  totalAmount: Decimal;
  items: Array<{
    menuItemId: string;
    quantity: number;
    unitPrice: Decimal;
    subtotal: Decimal;
  }>;
}

export interface UpdateOrderData {
  customerName?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
}

export interface FindAllParams {
  page: number;
  limit: number;
  status?: OrderStatus;
  phoneNumber?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export abstract class OrderRepository {
  abstract create(data: CreateOrderData): Promise<OrderWithItems>;
  abstract findAll(
    params: FindAllParams,
  ): Promise<PaginatedResult<OrderWithItems>>;
  abstract findById(id: string): Promise<OrderWithItems | null>;
  abstract findByIdempotencyKey(key: string): Promise<OrderWithItems | null>;
  abstract update(id: string, data: UpdateOrderData): Promise<OrderWithItems>;
  abstract updateStatus(
    id: string,
    status: OrderStatus,
    expectedCurrentStatus?: OrderStatus,
  ): Promise<OrderWithItems>;
}
