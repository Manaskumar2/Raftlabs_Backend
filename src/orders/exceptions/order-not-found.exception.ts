import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';

export class OrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super(`Order with ID ${orderId} not found`, ErrorCode.ORDER_NOT_FOUND, 404);
  }
}
