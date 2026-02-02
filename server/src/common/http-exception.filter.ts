import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      // 特殊处理：将 UnauthorizedException 的状态码改为 500
      status = exception instanceof UnauthorizedException ? 500 : exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        // 处理验证错误等复杂响应
        const responseObj = exceptionResponse as any;
        if (responseObj.message) {
          message = Array.isArray(responseObj.message)
            ? responseObj.message.join(', ')
            : responseObj.message;
        } else if (responseObj.error) {
          message = responseObj.error;
        }
      } else if (exception instanceof Error) {
        message = exception.message;
      }
    }

    // 记录错误日志
    console.error('Exception caught:', {
      status,
      message,
      stack: exception instanceof Error ? exception.stack : 'No stack trace',
    });

    response.status(status).json({
      code: status,
      result: false,
      data: null,
      message,
    });
  }
}