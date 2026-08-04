import { ErrorCode } from '../constants/error-codes';

export abstract class DomainException extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(message: string, code: ErrorCode, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
