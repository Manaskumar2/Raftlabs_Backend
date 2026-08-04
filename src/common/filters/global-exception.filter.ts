import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../constants/error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = 500;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';

    if (exception instanceof DomainException) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseData = exception.getResponse() as
        string | Record<string, unknown>;

      if (typeof responseData === 'object' && 'message' in responseData) {
        const responseMessage = responseData.message;
        if (Array.isArray(responseMessage)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = (responseMessage as string[]).join('; ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else {
          message = exception.message;
        }
      } else if (typeof responseData === 'string') {
        message = responseData;
      } else {
        message = exception.message;
      }

      if (
        (code as ErrorCode) === ErrorCode.INTERNAL_ERROR &&
        statusCode === 400
      ) {
        code = ErrorCode.VALIDATION_ERROR;
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P2')
    ) {
      const prismaError = exception as { code: string; message: string; meta?: any };
      if (prismaError.code === 'P2025') {
        statusCode = 404;
        code = ErrorCode.RESOURCE_NOT_FOUND;
        message = 'Record not found';
      } else if (prismaError.code === 'P2002') {
        statusCode = 409;
        code = ErrorCode.RESOURCE_CONFLICT;
        message = 'Unique constraint failed';
      } else {
        statusCode = 400;
        code = ErrorCode.DATABASE_ERROR;
        message = 'Database request failed';
      }
      this.logger.warn(`Prisma Error [${prismaError.code}]: ${prismaError.message}`);
    } else {
      this.logger.error(
        `Unhandled Exception: ${(exception as Error).message}`,
        (exception as Error).stack,
      );
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
