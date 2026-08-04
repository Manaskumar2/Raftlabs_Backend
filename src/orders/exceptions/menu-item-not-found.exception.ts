import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';

export class MenuItemNotFoundException extends DomainException {
  constructor(itemIds: string | string[]) {
    const ids = Array.isArray(itemIds) ? itemIds.join(', ') : itemIds;
    super(`Menu item(s) not found: ${ids}`, ErrorCode.MENU_ITEM_NOT_FOUND, 404);
  }
}
