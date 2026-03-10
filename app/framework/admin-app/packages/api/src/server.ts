/**
 * Admin App API Server - Spring Boot 风格自动配置
 * 
 * 配置文件: app.config.ts
 * - server.port: 服务端口
 * - server.servlet.contextPath: API 路径前缀
 * - database.*: 数据库配置
 * - security.*: 安全配置
 */
import { createApp } from '@ai-partner-x/aiko-boot';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 创建应用（自动加载配置、扫描组件、配置 Express）
const app = await createApp({ srcDir: __dirname });

// 启动 HTTP 服务器
app.run();
