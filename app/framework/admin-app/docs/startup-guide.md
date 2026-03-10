# 项目启动指南

## 快速启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建核心包

```bash
# 逐个构建核心包
cd packages/core && pnpm build
cd ../di && pnpm build
cd ../orm && pnpm build
cd ../nextjs && pnpm build
```
### 3. 初始化数据库

```bash
# 确保在项目根目录下，创建数据库目录
# Windows CMD:
mkdir app\framework\admin-app\packages\api\data
# Windows PowerShell / Linux / macOS:
mkdir -p app/framework/admin-app/packages/api/data

# 进入项目目录
cd app/framework/admin-app

# 初始化数据库
pnpm init-db
```

### 4. 启动开发服务器

#### 方式一：同时启动前后端

```bash
cd app/framework/admin-app
pnpm dev
```

#### 方式二：单独启动

**启动API服务：**
```bash
cd app/framework/admin-app/packages/api
pnpm dev
```

**启动前端页面：**
```bash
cd app/framework/admin-app/packages/web
pnpm dev
```

### 5. 访问项目

- **前端页面：** http://localhost:5174/
- **API接口：** http://localhost:3002/

### 6. 测试登录接口

#### PowerShell命令：
```powershell
Invoke-RestMethod -Uri http://localhost:3002/api/auth/login -Method Post -ContentType "application/json" -Body '{"username": "admin", "password": "Admin@123"}'
```

#### curl命令（适用于Git Bash）：
```bash
curl -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "Admin@123"}'
```

**注意：** 必须使用POST请求，不能直接在浏览器地址栏访问GET请求。在Windows命令提示符中使用curl时需要注意引号转义。

## 调试模式

### VS Code 调试

1. 按 `F5`
2. 选择 "Debug Admin API" 配置
3. 在代码中设置断点

### 命令行调试

```bash
cd app/framework/admin-app/packages/api
node --import @swc-node/register/esm-register --inspect src/server.ts
```

## 默认账号

- **用户名：** admin
- **密码：** Admin@123

## 常见问题

### 登录接口报错（Illegal arguments: undefined, string）

**原因：** 请求参数格式错误或缺少必要参数。

**解决方案：**
```powershell
# PowerShell命令（推荐）
Invoke-RestMethod -Uri http://localhost:3002/api/auth/login -Method Post -ContentType "application/json" -Body '{"username": "admin", "password": "Admin@123"}'
```

**注意：** 必须发送JSON格式的POST请求，不能使用GET请求。在Windows命令提示符中使用curl时需要注意引号转义。

### 构建失败（组件包错误）

如果遇到组件包构建错误：
```bash
# 逐个构建核心包
cd packages/core && pnpm build
cd ../di && pnpm build
cd ../orm && pnpm build
cd ../nextjs && pnpm build

# 或者直接启动服务（跳过构建）
cd app/framework/admin-app
pnpm dev:api
pnpm dev:web
```

### 端口冲突

如果端口被占用，可以修改配置文件或使用以下命令：

```bash
# 修改API端口
set PORT=3003 && pnpm dev

# 修改前端端口
pnpm dev --port 5175
```

### 数据库初始化失败

确保目录存在：
```bash
mkdir -p app/framework/admin-app/packages/api/data
```

## 技术栈

- **后端：** Node.js + Express + TypeScript
- **前端：** React + Vite + TypeScript
- **数据库：** SQLite
- **ORM：** Kysely
- **认证：** JWT + bcrypt

## 项目结构

```
app/framework/admin-app/
├── packages/
│   ├── api/          # 后端API服务
│   └── web/          # 前端页面
├── pnpm-lock.yaml
└── package.json
```
