# @scaffold/mobile

移动端 H5 应用，Vite + React + 路由 + 鉴权。

## 工程目录（最佳实践）

```
src/
├── app/                 # 应用入口与全局样式
│   └── globals.css
├── components/          # 可复用 UI 组件
│   └── LoginForm.tsx
├── hooks/               # 自定义 Hooks
│   └── index.ts
├── lib/                 # 工具函数与通用逻辑
│   └── utils.ts
├── pages/               # 页面级组件（按路由对应）
│   ├── index.ts
│   ├── LoginPage.tsx
│   └── HomePage.tsx
├── providers/           # 全局 Context 包装
│   └── AuthProviderWrapper.tsx
├── routes/              # 路由配置与守卫
│   ├── index.tsx        # 路由表与 Router
│   ├── routes.ts        # 路径常量
│   └── ProtectedRoute.tsx
├── types/               # 全局类型
│   └── index.ts
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

## 路由

| 路径     | 说明     | 鉴权   |
|----------|----------|--------|
| `/login` | 登录页   | 已登录则跳转首页 |
| `/`      | 主页     | 需登录，未登录跳转登录 |

登录成功后跳转到主页；访问未定义路径时重定向到 `/`。

## 开发

```bash
pnpm dev      # 开发服务器 http://localhost:3002
pnpm build    # 构建
pnpm preview  # 预览构建结果
```

## 依赖

- `@scaffold/shared-auth`：鉴权 Context
- `@scaffold/api`：接口客户端
- `react-router-dom`：路由
