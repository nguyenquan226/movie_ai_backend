import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const isProduction = process.env.NODE_ENV === 'production';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : exception;
    const stack = exception instanceof Error ? exception.stack : undefined;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] })?.message ||
          'Internal server error';

    const payload =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message };

    this.logger.error(
      JSON.stringify({
        requestId: request.requestId,
        method: request.method,
        url: request.originalUrl,
        statusCode: status,
        message,
        stack,
      }),
    );

    response.status(status).json({
      statusCode: status,
      EC: (payload as { EC?: number }).EC ?? 1,
      EM: Array.isArray(message) ? message.join(', ') : message,
      requestId: request.requestId,
      path: request.url,
      ...(isProduction ? {} : { error: payload }),
    });
  }
}
