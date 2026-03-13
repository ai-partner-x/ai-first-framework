import type { AppConfig } from '@ai-partner-x/aiko-boot';

/**
 * Storage-Upload 配置文件（Spring Boot 风格）
 *
 * 默认使用本地文件系统存储（local provider）。
 * 如需切换到 OSS/COS，修改 storage.provider 并补充对应配置块。
 *
 * 运行示例：
 *   pnpm dev
 *
 * 接口列表：
 *   POST   http://localhost:3003/api/upload          单文件上传（form-data: file, folder?）
 *   POST   http://localhost:3003/api/upload/multiple 多文件上传（form-data: files[], folder?）
 *   DELETE http://localhost:3003/api/upload?key=...  删除文件
 *   GET    http://localhost:3003/api/upload/url?key=...     获取文件 URL
 *   GET    http://localhost:3003/api/upload/preview?key=... 获取图片预览 URL
 */

// 统一端口变量，确保 server.port 与 storage.local.baseUrl 始终一致
const PORT = Number(process.env.PORT) || 3003;

export default {
  // ========== Server Configuration (server.*) ==========
  server: {
    port: PORT,
    servlet: {
      contextPath: '/api',
    },
    shutdown: 'graceful',
  },

  // ========== Logging Configuration (logging.*) ==========
  logging: {
    level: {
      root: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  },

  // ========== Storage Configuration (storage.*) ==========
  storage: {
    provider: 'local',
    local: {
      uploadDir: './uploads',
      baseUrl: `http://localhost:${PORT}/api/uploads`,
    },
  },

  // ========== Upload Policy Configuration (upload.*) ==========
  // 文件上传策略：允许的 MIME 类型和最大文件大小
  // 修改此处即可调整上传限制，无需改动控制器代码
  upload: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB (单位: 字节)
  },
} satisfies AppConfig;
