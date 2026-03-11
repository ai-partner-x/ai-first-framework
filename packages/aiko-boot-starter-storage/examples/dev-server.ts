/**
 * aiko-boot-starter-storage 开发调试服务器
 *
 * 零依赖（仅 Node.js 内置 http 模块），用于 Postman / curl 可视化测试。
 *
 * 启动：
 *   ../../node_modules/.bin/tsx examples/dev-server.ts
 *
 * ──────────────────────────────────────────────────────────
 *  接口列表
 * ──────────────────────────────────────────────────────────
 *
 *  POST /upload
 *    Headers : Content-Type: image/png  (或 image/jpeg 等)
 *    Query   : fileName=photo.png  folder=images  (可选)
 *    Body    : 二进制文件内容（Postman → Body → binary → 选择文件）
 *    返回    : { url, key, size, mimeType, provider, originalName }
 *
 *  GET /preview?key=images/xxx.png
 *    返回    : { previewUrl }
 *    Query   : width height quality format fit  (均可选)
 *
 *  GET /url?key=images/xxx.png
 *    返回    : { url }
 *
 *  DELETE /file?key=images/xxx.png
 *    返回    : { ok: true }
 *
 *  GET /health
 *    返回    : { status: "ok", uploadDir, baseUrl }
 */
import 'reflect-metadata';
import {http} from 'http';
import { join } from 'path';
import { StorageService, LocalStorageAdapter, StorageError } from '../src/index.js';
import type { ImagePreviewOptions } from '../src/index.js';

// ──────────────────────────────────────────
// 配置
// ──────────────────────────────────────────
const PORT = 3100;
const UPLOAD_DIR = join(process.cwd(), 'tmp-uploads');
const BASE_URL = `http://localhost:${PORT}/files`;

// ──────────────────────────────────────────
// 初始化 StorageService
// ──────────────────────────────────────────
const adapter = new LocalStorageAdapter({ uploadDir: UPLOAD_DIR, baseUrl: BASE_URL });
const storage = new StorageService();
storage.setAdapter(adapter);

// ──────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────
function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)));
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ──────────────────────────────────────────
// HTTP Server
// ──────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const rawUrl = req.url ?? '/';
  const pathname = rawUrl.split('?')[0];
  const q = parseQuery(rawUrl);

  try {
    // ── GET /health ─────────────────────────
    if (req.method === 'GET' && pathname === '/health') {
      return json(res, 200, { status: 'ok', uploadDir: UPLOAD_DIR, baseUrl: BASE_URL });
    }

    // ── POST /upload ────────────────────────
    if (req.method === 'POST' && pathname === '/upload') {
      const fileName = q['fileName'] ?? 'upload.bin';
      const folder = q['folder'];
      const maxSize = q['maxSize'] ? Number(q['maxSize']) : undefined;
      const allowedTypesRaw = q['allowedTypes'];
      const allowedTypes = allowedTypesRaw ? allowedTypesRaw.split(',') : undefined;

      const file = await readBody(req);

      if (file.length === 0) {
        return json(res, 400, { error: 'Body 为空，请在 Postman Body → binary 中选择文件' });
      }

      const result = await storage.upload(file, fileName, {
        folder,
        maxSize,
        allowedTypes,
      });

      return json(res, 200, result);
    }

    // ── GET /preview ─────────────────────────
    if (req.method === 'GET' && pathname === '/preview') {
      const key = q['key'];
      if (!key) return json(res, 400, { error: '缺少 query 参数: key' });

      const options: ImagePreviewOptions = {};
      if (q['width']) options.width = Number(q['width']);
      if (q['height']) options.height = Number(q['height']);
      if (q['quality']) options.quality = Number(q['quality']);
      if (q['format']) options.format = q['format'] as ImagePreviewOptions['format'];
      if (q['fit']) options.fit = q['fit'] as ImagePreviewOptions['fit'];

      const previewUrl = await storage.getPreviewUrl(key, Object.keys(options).length ? options : undefined);
      return json(res, 200, { previewUrl });
    }

    // ── GET /url ─────────────────────────────
    if (req.method === 'GET' && pathname === '/url') {
      const key = q['key'];
      if (!key) return json(res, 400, { error: '缺少 query 参数: key' });
      const url = await storage.getUrl(key);
      return json(res, 200, { url });
    }

    // ── DELETE /file ─────────────────────────
    if (req.method === 'DELETE' && pathname === '/file') {
      const key = q['key'];
      if (!key) return json(res, 400, { error: '缺少 query 参数: key' });
      await storage.delete(key);
      return json(res, 200, { ok: true, deleted: key });
    }

    // ── 静态文件预览（/files/:key）────────────
    if (req.method === 'GET' && pathname.startsWith('/files/')) {
      const { createReadStream, existsSync } = await import('fs');
      const { extname } = await import('path');
      const key = pathname.slice('/files/'.length);
      const filePath = join(UPLOAD_DIR, key);
      if (!existsSync(filePath)) {
        return json(res, 404, { error: '文件不存在' });
      }
      const ext = extname(key).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
      };
      res.writeHead(200, { 'Content-Type': mimeMap[ext] ?? 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
      return;
    }

    json(res, 404, { error: `未知路由: ${req.method} ${pathname}` });
  } catch (e) {
    if (e instanceof StorageError) {
      return json(res, 400, { error: e.message, code: e.code });
    }
    console.error(e);
    json(res, 500, { error: String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Storage 调试服务器已启动\n`);
  console.log(`   健康检查  : GET  http://localhost:${PORT}/health`);
  console.log(`   上传文件  : POST http://localhost:${PORT}/upload?fileName=photo.png&folder=images`);
  console.log(`   获取 URL  : GET  http://localhost:${PORT}/url?key=images/xxx.png`);
  console.log(`   预览 URL  : GET  http://localhost:${PORT}/preview?key=images/xxx.png&width=200&format=webp`);
  console.log(`   删除文件  : DELETE http://localhost:${PORT}/file?key=images/xxx.png`);
  console.log(`   在线预览  : GET  http://localhost:${PORT}/files/images/xxx.png`);
  console.log(`\n   上传目录  : ${UPLOAD_DIR}`);
  console.log(`\n   Postman 上传姿势:`);
  console.log(`     Method : POST`);
  console.log(`     URL    : http://localhost:${PORT}/upload?fileName=photo.png&folder=images`);
  console.log(`     Body   : binary → 选择本地图片文件`);
  console.log(`\n   按 Ctrl+C 停止服务器\n`);
});
