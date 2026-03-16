import { Request, Response, NextFunction } from 'express';
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';

const logger = getLogger('http');

/**
 * HTTP请求日志服务
 * 提供HTTP请求日志记录功能
 */
export class RequestLogService {
  /**
   * 完整的HTTP请求日志中间件
   * 记录所有HTTP请求的详细信息
   */
  static requestLogMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // 获取请求信息
    const requestInfo = {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
      referer: req.get('referer'),
    };

    // 记录请求开始
    logger.http('Request started', requestInfo);

    // 监听响应完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      const responseInfo = {
        ...requestInfo,
        status: res.statusCode,
        statusMessage: res.statusMessage,
        duration: `${duration}ms`,
        responseTime: duration,
        timestamp: new Date().toISOString(),
      };

      // 根据状态码选择日志级别
      if (res.statusCode >= 500) {
        logger.error('Request completed with server error', responseInfo);
      } else if (res.statusCode >= 400) {
        logger.warn('Request completed with client error', responseInfo);
      } else {
        logger.http('Request completed successfully', responseInfo);
      }
    });

    // 监听响应关闭事件（客户端提前断开连接）
    res.on('close', () => {
      if (!res.writableFinished) {
        const duration = Date.now() - startTime;
        logger.warn('Request closed by client before completion', {
          ...requestInfo,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    next();
  }
}

