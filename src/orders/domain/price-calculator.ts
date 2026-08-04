import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PriceCalculator {
  calculateItemSubtotal(unitPrice: Decimal, quantity: number): Decimal {
    return unitPrice.mul(quantity);
  }

  calculateTotalAmount(
    items: Array<{ unitPrice: Decimal; quantity: number }>,
  ): Decimal {
    return items.reduce(
      (total, item) =>
        total.add(this.calculateItemSubtotal(item.unitPrice, item.quantity)),
      new Decimal(0),
    );
  }
}
