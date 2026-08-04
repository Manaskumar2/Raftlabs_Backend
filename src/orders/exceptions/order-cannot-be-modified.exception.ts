import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { OrderStatus } from '@prisma/client';

export class OrderCannotBeModifiedException extends DomainException {
  constructor(currentStatus: OrderStatus) {
    super(
      `Order cannot be modified in '${currentStatus}' status. Modifications are only allowed when status is ORDER_RECEIVED.`,
      ErrorCode.ORDER_CANNOT_BE_MODIFIED,
      409,
    );
  }
}
