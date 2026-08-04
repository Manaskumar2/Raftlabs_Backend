import { OrderStatusPolicy } from '../order-status.policy';
import { OrderStatus } from '@prisma/client';
import { InvalidStatusTransitionException } from '../../exceptions/invalid-status-transition.exception';

describe('OrderStatusPolicy', () => {
  let policy: OrderStatusPolicy;

  beforeEach(() => {
    policy = new OrderStatusPolicy();
  });

  describe('validateTransition', () => {
    it('should allow valid transitions', () => {
      expect(() =>
        policy.validateTransition(
          OrderStatus.ORDER_RECEIVED,
          OrderStatus.PREPARING,
        ),
      ).not.toThrow();
      expect(() =>
        policy.validateTransition(
          OrderStatus.PREPARING,
          OrderStatus.OUT_FOR_DELIVERY,
        ),
      ).not.toThrow();
      expect(() =>
        policy.validateTransition(
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
        ),
      ).not.toThrow();
      expect(() =>
        policy.validateTransition(
          OrderStatus.ORDER_RECEIVED,
          OrderStatus.CANCELLED,
        ),
      ).not.toThrow();
      expect(() =>
        policy.validateTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('should throw InvalidStatusTransitionException for invalid transitions', () => {
      expect(() =>
        policy.validateTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(
          OrderStatus.CANCELLED,
          OrderStatus.ORDER_RECEIVED,
        ),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.CANCELLED,
        ),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(
          OrderStatus.ORDER_RECEIVED,
          OrderStatus.DELIVERED,
        ),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(
          OrderStatus.ORDER_RECEIVED,
          OrderStatus.OUT_FOR_DELIVERY,
        ),
      ).toThrow(InvalidStatusTransitionException);
      expect(() =>
        policy.validateTransition(
          OrderStatus.PREPARING,
          OrderStatus.ORDER_RECEIVED,
        ),
      ).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('canCancel', () => {
    it('should return true for ORDER_RECEIVED and PREPARING', () => {
      expect(policy.canCancel(OrderStatus.ORDER_RECEIVED)).toBe(true);
      expect(policy.canCancel(OrderStatus.PREPARING)).toBe(true);
    });

    it('should return false for OUT_FOR_DELIVERY, DELIVERED, CANCELLED', () => {
      expect(policy.canCancel(OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
      expect(policy.canCancel(OrderStatus.DELIVERED)).toBe(false);
      expect(policy.canCancel(OrderStatus.CANCELLED)).toBe(false);
    });
  });

  describe('canModify', () => {
    it('should return true only for ORDER_RECEIVED', () => {
      expect(policy.canModify(OrderStatus.ORDER_RECEIVED)).toBe(true);
    });

    it('should return false for all other statuses', () => {
      expect(policy.canModify(OrderStatus.PREPARING)).toBe(false);
      expect(policy.canModify(OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
      expect(policy.canModify(OrderStatus.DELIVERED)).toBe(false);
      expect(policy.canModify(OrderStatus.CANCELLED)).toBe(false);
    });
  });

  describe('getNextStatus', () => {
    it('should return correct next non-cancel status', () => {
      expect(policy.getNextStatus(OrderStatus.ORDER_RECEIVED)).toBe(
        OrderStatus.PREPARING,
      );
      expect(policy.getNextStatus(OrderStatus.PREPARING)).toBe(
        OrderStatus.OUT_FOR_DELIVERY,
      );
      expect(policy.getNextStatus(OrderStatus.OUT_FOR_DELIVERY)).toBe(
        OrderStatus.DELIVERED,
      );
    });

    it('should return null for terminal statuses', () => {
      expect(policy.getNextStatus(OrderStatus.DELIVERED)).toBeNull();
      expect(policy.getNextStatus(OrderStatus.CANCELLED)).toBeNull();
    });
  });

  describe('isTerminal', () => {
    it('should return true for DELIVERED and CANCELLED', () => {
      expect(policy.isTerminal(OrderStatus.DELIVERED)).toBe(true);
      expect(policy.isTerminal(OrderStatus.CANCELLED)).toBe(true);
    });

    it('should return false for others', () => {
      expect(policy.isTerminal(OrderStatus.ORDER_RECEIVED)).toBe(false);
      expect(policy.isTerminal(OrderStatus.PREPARING)).toBe(false);
      expect(policy.isTerminal(OrderStatus.OUT_FOR_DELIVERY)).toBe(false);
    });
  });
});
