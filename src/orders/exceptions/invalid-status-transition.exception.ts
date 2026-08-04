import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { OrderStatus } from '@prisma/client';

export class InvalidStatusTransitionException extends DomainException {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      `Cannot transition order status from ${from} to ${to}`,
      ErrorCode.INVALID_ORDER_STATUS_TRANSITION,
      409,
    );
  }
}
