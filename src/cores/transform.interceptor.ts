import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from 'src/decorators/customize';

export interface Response<T> {
  statusCode: number;
  message?: string;
  data: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const message = this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) || '';
        if (data && typeof data === 'object' && 'EC' in data && 'EM' in data) {
          const { EC, EM, ...restData } = data as any;

          return {
            statusCode,
            message,
            EC,
            EM,
            data: restData,
          };
        }

        return {
          statusCode,
          message,
          data: data,
        };
      }),
    );
  }
}
