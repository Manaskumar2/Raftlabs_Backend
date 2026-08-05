import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, Order, OrderItem, MenuItem } from '@prisma/client';

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  menuItemId: string;

  @ApiProperty()
  menuItem: {
    name: string;
    imageUrl: string;
  };

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: string;

  @ApiProperty()
  subtotal: string;
}

type OrderWithItems = Order & {
  items: (OrderItem & {
    menuItem: MenuItem;
  })[];
};

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  deliveryAddress: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  totalAmount: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(order: OrderWithItems): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.customerName = order.customerName;
    dto.deliveryAddress = order.deliveryAddress;
    dto.phoneNumber = order.phoneNumber;
    dto.status = order.status;
    dto.totalAmount = order.totalAmount.toString();
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;

    dto.items = order.items.map((item) => {
      const itemDto = new OrderItemResponseDto();
      itemDto.id = item.id;
      itemDto.menuItemId = item.menuItemId;
      itemDto.menuItem = {
        name: item.menuItem.name,
        imageUrl: item.menuItem.imageUrl,
      };
      itemDto.quantity = item.quantity;
      itemDto.unitPrice = item.unitPrice.toString();
      itemDto.subtotal = item.subtotal.toString();
      return itemDto;
    });

    return dto;
  }
}
