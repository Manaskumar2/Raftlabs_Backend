import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../common/constants/error-codes';

export class MenuItemUnavailableException extends DomainException {
  constructor(itemNames: string | string[]) {
    const names = Array.isArray(itemNames) ? itemNames.join(', ') : itemNames;
    super(
      `Menu item(s) currently unavailable: ${names}`,
      ErrorCode.MENU_ITEM_UNAVAILABLE,
      422,
    );
  }
}
