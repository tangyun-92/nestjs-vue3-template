import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 简单的请求日志中间件
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url } = req;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // 记录请求信息（简化版）
    console.log(`📥 ${method} ${url} - ${ip} - ${userAgent}`);

    // 记录响应时间
    const startTime = Date.now();

    // 监听响应完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`📤 ${res.statusCode} ${method} ${url} - ${duration}ms`);
    });

    next();
  }
}
