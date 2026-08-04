import { PriceCalculator } from '../price-calculator';
import { Decimal } from '@prisma/client/runtime/library';

describe('PriceCalculator', () => {
  let calculator: PriceCalculator;

  beforeEach(() => {
    calculator = new PriceCalculator();
  });

  describe('calculateItemSubtotal', () => {
    it('should calculate subtotal for a single item price and quantity', () => {
      const price = new Decimal('150.50');
      const quantity = 2;
      const subtotal = calculator.calculateItemSubtotal(price, quantity);

      expect(subtotal).toBeInstanceOf(Decimal);
      expect(subtotal.equals(new Decimal('301.00'))).toBe(true);
    });

    it('should handle large quantities', () => {
      const price = new Decimal('10.00');
      const quantity = 1000;
      const subtotal = calculator.calculateItemSubtotal(price, quantity);

      expect(subtotal).toBeInstanceOf(Decimal);
      expect(subtotal.equals(new Decimal('10000.00'))).toBe(true);
    });
  });

  describe('calculateTotalAmount', () => {
    it('should calculate total for a single item', () => {
      const items = [{ unitPrice: new Decimal('199.99'), quantity: 1 }];
      const total = calculator.calculateTotalAmount(items);

      expect(total).toBeInstanceOf(Decimal);
      expect(total.equals(new Decimal('199.99'))).toBe(true);
    });

    it('should calculate total for multiple items', () => {
      const items = [
        { unitPrice: new Decimal('100.00'), quantity: 2 },
        { unitPrice: new Decimal('50.00'), quantity: 1 },
      ];
      const total = calculator.calculateTotalAmount(items);

      expect(total).toBeInstanceOf(Decimal);
      expect(total.equals(new Decimal('250.00'))).toBe(true);
    });

    it('should return zero for empty array', () => {
      const items: Array<{ unitPrice: Decimal; quantity: number }> = [];
      const total = calculator.calculateTotalAmount(items);

      expect(total).toBeInstanceOf(Decimal);
      expect(total.equals(new Decimal('0'))).toBe(true);
    });

    it('should avoid floating point errors', () => {
      const items = [
        { unitPrice: new Decimal('0.1'), quantity: 1 },
        { unitPrice: new Decimal('0.2'), quantity: 1 },
      ];
      const total = calculator.calculateTotalAmount(items);

      expect(total).toBeInstanceOf(Decimal);
      expect(total.equals(new Decimal('0.3'))).toBe(true);
    });
  });
});
