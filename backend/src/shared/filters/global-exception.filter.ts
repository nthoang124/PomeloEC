import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ZodValidationException } from 'nestjs-zod';
import { BusinessException } from '../core/exceptions/BusinessException';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Gen traceId or get from header
    const traceId = request.headers['x-trace-id'] || randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown = null;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_FAILED';
      message = 'Validation failed';
      const zodError = exception.getZodError() as {
        errors: Array<{ path: string[]; message: string }>;
      };
      details = zodError.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<
        string,
        unknown
      >;

      message = (exceptionResponse.message as string) || exception.message;
      errorCode =
        typeof exceptionResponse.error === 'string'
          ? exceptionResponse.error
          : typeof exceptionResponse.code === 'string'
            ? exceptionResponse.code
            : HttpStatus[status].toString();

      if (Array.isArray(exceptionResponse.message)) {
        details = exceptionResponse.message;
        message = 'Validation failed';
      }
    } else if (exception instanceof BusinessException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof Error) {
      // In production, mask generic errors. For dev, we expose it.
      message = exception.message;
    }

    // TODO: Log exception using Pino with traceId

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        details: details,
      },
      traceId: traceId,
    });
  }
}
