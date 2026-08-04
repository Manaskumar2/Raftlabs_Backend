import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          const paginatedData = data as {
            data: T;
            meta: Record<string, unknown>;
          };
          return {
            success: true,
            data: paginatedData.data,
            meta: paginatedData.meta,
          };
        }

        return {
          success: true,
          data: data as T,
        };
      }),
    );
  }
}
