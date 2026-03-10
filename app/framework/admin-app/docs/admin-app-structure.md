# Admin App 项目结构说明

## 一、接口与代码文件映射关系

### 1. 认证接口 (`/api/auth/`)
- **登录接口** (`POST /api/auth/login`): `packages/api/src/controller/auth.controller.ts`
- **刷新令牌** (`POST /api/auth/refresh`): `packages/api/src/controller/auth.controller.ts`
- **获取用户信息** (`GET /api/auth/info`): `packages/api/src/controller/auth.controller.ts`

### 2. 用户管理接口 (`/api/sys/user/`)
- **分页查询用户** (`GET /api/sys/user/page`): `packages/api/src/controller/user.controller.ts`
- **获取用户详情** (`GET /api/sys/user/:id`): `packages/api/src/controller/user.controller.ts`
- **创建用户** (`POST /api/sys/user`): `packages/api/src/controller/user.controller.ts`
- **更新用户** (`PUT /api/sys/user/:id`): `packages/api/src/controller/user.controller.ts`
- **删除用户** (`DELETE /api/sys/user/:id`): `packages/api/src/controller/user.controller.ts`
- **重置密码** (`PUT /api/sys/user/:id/password`): `packages/api/src/controller/user.controller.ts`

### 3. 角色管理接口 (`/api/sys/role/`)
- **查询角色列表** (`GET /api/sys/role/list`): `packages/api/src/controller/role.controller.ts`
- **获取角色详情** (`GET /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **创建角色** (`POST /api/sys/role`): `packages/api/src/controller/role.controller.ts`
- **更新角色** (`PUT /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **删除角色** (`DELETE /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **获取角色菜单** (`GET /api/sys/role/:id/menus`): `packages/api/src/controller/role.controller.ts`
- **分配菜单** (`PUT /api/sys/role/:id/menus`): `packages/api/src/controller/role.controller.ts`

### 3. 角色管理接口 (`/api/sys/role/`)
- **查询角色列表** (`GET /api/sys/role/list`): `packages/api/src/controller/role.controller.ts`
- **获取角色详情** (`GET /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **创建角色** (`POST /api/sys/role`): `packages/api/src/controller/role.controller.ts`
- **更新角色** (`PUT /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **删除角色** (`DELETE /api/sys/role/:id`): `packages/api/src/controller/role.controller.ts`
- **获取角色菜单** (`GET /api/sys/role/:id/menus`): `packages/api/src/controller/role.controller.ts`
- **分配菜单** (`PUT /api/sys/role/:id/menus`): `packages/api/src/controller/role.controller.ts`

### 4. 菜单管理接口 (`/api/sys/menu/`)
- **获取菜单树** (`GET /api/sys/menu/tree`): `packages/api/src/controller/menu.controller.ts`
- **获取用户菜单树** (`GET /api/sys/menu/user-tree`): `packages/api/src/controller/menu.controller.ts`
- **获取菜单详情** (`GET /api/sys/menu/:id`): `packages/api/src/controller/menu.controller.ts`
- **创建菜单** (`POST /api/sys/menu`): `packages/api/src/controller/menu.controller.ts`
- **更新菜单** (`PUT /api/sys/menu/:id`): `packages/api/src/controller/menu.controller.ts`
- **删除菜单** (`DELETE /api/sys/menu/:id`): `packages/api/src/controller/menu.controller.ts`

## 二、项目文件夹结构说明

### 1. `docs/` - 文档与测试脚本
- **核心文件**:
  - `api-test-documentation.md`: 完整的 API 测试文档
  - `new-test-results.md`: 接口测试结果记录
  - `startup-guide.md`: 项目启动指南
- **测试脚本**:
  - `execute-and-save.js`: 自动化测试失败接口
  - `test-create-role.js` 系列: 角色创建功能测试
  - `test-failed-interfaces.js`: 失败接口专项测试

### 2. `packages/api/` - 后端 API 服务
- **`src/controller/`**: 路由控制器，处理 HTTP 请求
  - `auth.controller.ts`: 认证接口实现
  - `user.controller.ts`: 用户管理接口实现
  - `role.controller.ts`: 角色管理接口实现
  - `menu.controller.ts`: 菜单管理接口实现
- **`src/service/`**: 业务逻辑层
  - `auth.service.ts`: 认证业务逻辑
  - `user.service.ts`: 用户业务逻辑
  - `role.service.ts`: 角色业务逻辑
  - `menu.service.ts`: 菜单业务逻辑
- **`src/mapper/`**: 数据访问层（ORM 映射）
  - `sys-user.mapper.ts`: 用户表操作
  - `sys-role.mapper.ts`: 角色表操作
  - `sys-menu.mapper.ts`: 菜单表操作
  - `sys-role-menu.mapper.ts`: 角色菜单关联操作
  - `sys-user-role.mapper.ts`: 用户角色关联操作（核心权限控制）
- **`src/entity/`**: 数据库实体定义
  - `sys-user.entity.ts`: 用户实体
  - `sys-role.entity.ts`: 角色实体
  - `sys-menu.entity.ts`: 菜单实体
  - `sys-user-role.entity.ts`: 用户角色关联实体
  - `sys-role-menu.entity.ts`: 角色菜单关联实体
- **`src/dto/`**: 数据传输对象
  - `auth.dto.ts`: 认证请求参数
  - `user.dto.ts`: 用户操作参数
  - `role.dto.ts`: 角色操作参数
  - `menu.dto.ts`: 菜单操作参数
- **`src/utils/`**: 工具函数
  - `jwt.util.ts`: JWT 认证工具
- **`src/scripts/`**: 脚本文件
  - `init-db.ts`: 数据库初始化脚本（不会覆盖已有数据）
    - 表结构创建使用 `ifNotExists()`，仅在表不存在时创建
    - 初始化数据前先检查是否已存在，存在则跳过
    - 保留已有的用户、角色、菜单数据
    - 仅在首次运行时插入默认超级管理员账号和菜单
- **`src/server.ts`**: 服务器入口文件

### 3. `packages/web/` - 前端 Web 应用
- **`src/api/`**: API 调用封装
- **`src/context/`**: React Context 管理
  - `AuthContext.tsx`: 认证状态管理
- **`src/layout/`**: 布局组件
  - `AdminLayout.tsx`: 后台管理布局
- **`src/pages/`**: 页面组件
  - `LoginPage.tsx`: 登录页面
  - `DashboardPage.tsx`: 仪表盘页面
  - `UserPage.tsx`: 用户管理页面
  - `RolePage.tsx`: 角色管理页面
  - `MenuPage.tsx`: 菜单管理页面
- **`src/App.tsx`**: 应用根组件
- **`src/main.tsx`**: 应用入口文件

### 4. 根目录配置文件
- **`package.json`**: 项目依赖管理
- **`pnpm-workspace.yaml`**: pnpm 工作区配置
- **`pnpm-lock.yaml`**: 依赖版本锁定文件

## 三、技术栈说明

### 后端 (`packages/api/`)
- **框架**: Node.js + Express
- **ORM**: Kysely
- **数据库**: SQLite
- **认证**: JWT
- **构建**: tsup

### 前端 (`packages/web/`)
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router

## 四、核心业务流程

### 1. 用户认证流程
1. 用户登录 → 验证用户名密码 → 生成 JWT 令牌
2. 后续请求携带 `Authorization: Bearer <token>` 头
3. 后端验证令牌有效性 → 处理业务请求

### 2. 角色权限管理
1. 创建角色 → 分配菜单权限
2. 用户关联角色 → 继承角色权限
3. 前端根据权限动态渲染菜单

### 3. 用户角色关联机制
- **`sys-user-role.mapper.ts`**: 核心权限控制组件
- 负责用户与角色之间的多对多关联管理
- 支持批量分配、更新、删除角色关联
- 提供角色权限递归查询能力

### 4. 菜单管理
1. 支持三级菜单结构（目录/菜单/按钮）
2. 基于权限控制菜单可见性
3. 动态生成路由配置