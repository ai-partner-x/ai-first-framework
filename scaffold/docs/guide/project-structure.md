# 项目结构

## 目录结构

```
scaffold/
├── docs/                    # 文档目录（VitePress）
├── examples/                # 示例代码
├── packages/
│   ├── admin/               # 管理后台前端
│   └── api/                 # API 后端
├── scripts/                 # 脚本工具
├── package.json
└── pnpm-workspace.yaml
```

## packages/api

API 后端服务，基于 Aiko Boot 框架。

### 主要目录

- `src/controller/` - 控制器
- `src/service/` - 业务逻辑
- `src/entity/` - 实体定义
- `src/mapper/` - 数据访问层
- `src/dto/` - 数据传输对象

## packages/admin

管理后台前端，基于 React + Vite。

### 主要目录

- `src/pages/` - 页面组件
- `src/components/` - 通用组件
- `src/hooks/` - 自定义 Hooks
- `src/routes/` - 路由配置
