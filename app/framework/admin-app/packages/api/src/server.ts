/**
 * Admin App API Server
 * 自定义 Express 启动，支持 JWT 全局鉴权中间件
 */
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createExpressRouter } from '@ai-partner-x/aiko-boot-starter-web';
import { createKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';
import { verifyAccessToken } from './utils/jwt.util.js';

// 注册 mapper（触发 @Mapper 装饰器，加入 DI 容器）
import './mapper/sys-user.mapper.js';
import './mapper/sys-role.mapper.js';
import './mapper/sys-menu.mapper.js';
import './mapper/sys-user-role.mapper.js';
import './mapper/sys-role-menu.mapper.js';

// 注册 service（触发 @Service 装饰器，加入 DI 容器）
import './service/auth.service.js';
import './service/user.service.js';
import './service/role.service.js';
import './service/menu.service.js';

// 导入 controller 类
import { AuthController } from './controller/auth.controller.js';
import { UserController } from './controller/user.controller.js';
import { RoleController } from './controller/role.controller.js';
import { MenuController } from './controller/menu.controller.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3002;

// 公开路径（无需 JWT）
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/refresh'];

// 初始化数据库
await createKyselyDatabase({
  type: 'sqlite',
  filename: join(__dirname, '../data/app.db'),
});

const app = express();

app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
app.use(express.json());

// JWT 鉴权中间件
app.use((req: any, res: any, next: any) => {
  if (PUBLIC_PATHS.includes(req.path)) return next();
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未登录，请先登录' });
  }
  try {
    req.user = verifyAccessToken(auth.slice(7));
    // 将用户信息注入 req.query，供 @RequestParam 装饰器读取
    (req as any).query._uid = String((req as any).user.userId);
    (req as any).query._perms = ((req as any).user.permissions || []).join(',');
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
});

// 注册路由
app.use(
  createExpressRouter(
    [AuthController, UserController, RoleController, MenuController],
    { prefix: '/api', verbose: true }
  )
);

app.listen(PORT, () => {
  console.log(`\n🚀 Admin App API running at http://localhost:${PORT}`);
  console.log(`📚 Login: POST http://localhost:${PORT}/api/auth/login\n`);
});
