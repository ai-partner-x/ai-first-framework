import type { Request, Response, NextFunction } from 'express';
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';

const logger = getLogger('http');

/**
 * HTTP 请求日志服务
 * 提供 HTTP 请求日志记录功能
 */
export class RequestLogService {
  /** 统一的 HTTP 请求日志中间件（包含开始/结束/错误/提前断开） */
  static requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    const requestInfo = RequestLogService.buildRequestInfo(req);
    logger.http('Request started', requestInfo);

    // 监听响应完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      const responseInfo = RequestLogService.buildResponseInfo(
        requestInfo,
        res,
        duration,
      );
      RequestLogService.logByStatus('Request completed', res.statusCode, responseInfo);
    });

    // 监听响应关闭事件（客户端提前断开连接）
    res.on('close', () => {
      if (!res.writableFinished) {
        const duration = Date.now() - startTime;
        RequestLogService.logClientDisconnect(req, duration);
      }
    });

    next();
  }

  /**
   * 记录 HTTP 请求信息（直接调用，非中间件）
   */
  static logRequest(req: Request, res: Response, duration: number) {
    const requestInfo = RequestLogService.buildRequestInfo(req);
    const responseInfo = RequestLogService.buildResponseInfo(
      requestInfo,
      res,
      duration,
    );
    RequestLogService.logByStatus(
      'Request completed (manual log)',
      res.statusCode,
      responseInfo,
    );
  }

  /**
   * 记录客户端提前断开连接
   */
  static logClientDisconnect(req: Request, duration: number) {
    logger.warn('Request closed by client before completion', {
      ...RequestLogService.buildRequestInfo(req),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  private static buildRequestInfo(req: Request) {
    return {
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
  }

  private static buildResponseInfo(
    requestInfo: ReturnType<typeof RequestLogService.buildRequestInfo>,
    res: Response,
    duration: number,
  ) {
    return {
      ...requestInfo,
      status: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      responseTime: duration,
      timestamp: new Date().toISOString(),
    };
  }

  private static logByStatus(
    prefix: string,
    statusCode: number,
    payload: Record<string, unknown>,
  ): void {
    if (statusCode >= 500) {
      logger.error(`${prefix} with server error`, payload);
    } else if (statusCode >= 400) {
      logger.warn(`${prefix} with client error`, payload);
    } else {
      logger.http(`${prefix} successfully`, payload);
    }
  }
}

