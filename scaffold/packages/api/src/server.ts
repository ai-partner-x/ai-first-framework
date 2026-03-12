/**
 * API Server - aiko-boot
 */
import { createApp } from '@ai-partner-x/aiko-boot';
import { getExpressApp } from '@ai-partner-x/aiko-boot-starter-web';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = await createApp({ srcDir: __dirname });

// 配置 multer 文件上传中间件
const expressApp = getExpressApp();
if (expressApp) {
  const upload = multer({ storage: multer.memoryStorage() });
  expressApp.post('/api/upload', upload.single('file'));
  expressApp.post('/api/upload/multiple', upload.array('files', 10));

  // 配置静态文件服务（本地存储时访问上传的文件）
  const uploadsDir = join(__dirname, '..', 'uploads');
  expressApp.use('/api/uploads', express.static(uploadsDir));
}

await app.run();
const port = app.config.get<number>('server.port', 3001);
console.log(`\n📡 API: http://localhost:${port}/api\n`);
