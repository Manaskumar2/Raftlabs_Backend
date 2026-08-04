import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { OrderStatus } from '@prisma/client';

export class OrderCannotBeCancelledException extends DomainException {
  constructor(currentStatus: OrderStatus) {
    super(
      `Order cannot be cancelled in '${currentStatus}' status. Cancellation is only allowed when status is ORDER_RECEIVED or PREPARING.`,
      ErrorCode.ORDER_CANNOT_BE_CANCELLED,
      409,
    );
  }
}
