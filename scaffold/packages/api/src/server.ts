/**
 * API Server - aiko-boot
 */
import { createApp } from '@ai-partner-x/aiko-boot';
import { getExpressApp } from '@ai-partner-x/aiko-boot-starter-web';
import { autoInit, getLogger } from '@ai-partner-x/aiko-boot-starter-log';
import { RequestLogService } from './service/log.request.service';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 初始化日志系统（自动从app.config.ts加载配置）
autoInit();

// 获取服务器logger
const logger = getLogger('server');

logger.info('Starting API server...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
});

const app = await createApp({ srcDir: __dirname });

// 配置HTTP请求日志中间件
const expressApp = getExpressApp();
if (expressApp) {
  // 添加请求日志中间件
  expressApp.use(RequestLogService.requestLogMiddleware);
  
  // 配置 multer 文件上传中间件
  const upload = multer({ storage: multer.memoryStorage() });
  expressApp.post('/api/upload', upload.single('file'));
  expressApp.post('/api/upload/multiple', upload.array('files', 10));

  // 配置静态文件服务（本地存储时访问上传的文件）
  const uploadsDir = join(__dirname, '..', 'uploads');
  expressApp.use('/api/uploads', express.static(uploadsDir));
  
  logger.info('Express middleware configured', {
    hasRequestLogging: true,
    hasFileUpload: true,
    hasStaticFiles: true,
  });
}

await app.run();
const port = app.config.get<number>('server.port', 3001);

logger.info('API Server started successfully', {
  port,
  baseUrl: `http://localhost:${port}/api`,
  env: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
});

// 保留控制台输出以便兼容
console.log(`\n📡 API: http://localhost:${port}/api\n`);

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error, {
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});