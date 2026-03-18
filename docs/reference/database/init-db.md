# 数据库初始化脚本说明

## 概述

数据库初始化脚本位于 `src/scripts/init-db.ts`，用于创建数据库表结构并初始化基础数据。该脚本使用 Kysely ORM 操作 SQLite 数据库。

## 执行方式

### 方式 1：使用 pnpm 脚本（推荐）

在 `scaffold/packages/api` 目录下执行：

```bash
cd scaffold/packages/api
pnpm init-db
```

### 方式 2：直接使用 Node.js 执行

```bash
cd scaffold/packages/api
node --import @swc-node/register/esm-register src/scripts/init-db.ts
```

## 初始化流程

脚本执行顺序如下：

```
1. 创建数据库文件目录
   ↓
2. 初始化 Kysely 数据库连接
   ↓
3. 创建表结构（6 张表）
   ↓
4. 创建超级管理员角色（如果不存在）
   ↓
5. 创建默认菜单和权限（如果不存在）
   ↓
6. 为超级管理员分配所有菜单权限
   ↓
7. 创建 admin 账号（如果不存在）
   ↓
8. 完成初始化
```

## 表结构说明

### 1. sys_user - 用户表

存储系统用户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | integer | PK, AI | 用户 ID，主键，自增 |
| user_name | varchar(50) | NOT NULL, UNIQUE | 用户名，唯一 |
| password_hash | varchar(255) | NOT NULL | 密码哈希值（bcrypt） |
| real_name | varchar(50) | - | 真实姓名 |
| email | varchar(100) | - | 邮箱 |
| phone | varchar(20) | - | 手机号 |
| status | integer | NOT NULL, DEFAULT 1 | 状态（0-禁用，1-启用） |
| created_at | datetime | - | 创建时间 |
| updated_at | datetime | - | 更新时间 |

**SQL 建表语句：**
```sql
CREATE TABLE IF NOT EXISTS sys_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  status INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

### 2. sys_role - 角色表

存储系统角色信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | integer | PK, AI | 角色 ID，主键，自增 |
| role_code | varchar(50) | NOT NULL, UNIQUE | 角色编码，唯一 |
| role_name | varchar(50) | NOT NULL | 角色名称 |
| description | varchar(255) | - | 角色描述 |
| status | integer | NOT NULL, DEFAULT 1 | 状态（0-禁用，1-启用） |
| created_at | datetime | - | 创建时间 |

**SQL 建表语句：**
```sql
CREATE TABLE IF NOT EXISTS sys_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  role_name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME
);
```

---

### 3. sys_menu - 菜单表

存储系统菜单和权限信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | integer | PK, AI | 菜单 ID，主键，自增 |
| parent_id | integer | NOT NULL, DEFAULT 0 | 父菜单 ID，0 表示顶级菜单 |
| menu_name | varchar(50) | NOT NULL | 菜单名称 |
| menu_type | integer | NOT NULL | 菜单类型（1-目录，2-菜单，3-按钮） |
| path | varchar(255) | - | 路由路径 |
| component | varchar(255) | - | 前端组件路径 |
| permission | varchar(100) | - | 权限标识 |
| icon | varchar(100) | - | 菜单图标 |
| sort_order | integer | NOT NULL, DEFAULT 0 | 排序 |
| status | integer | NOT NULL, DEFAULT 1 | 状态（0-禁用，1-启用） |

**菜单类型说明：**
- **1** - 目录：菜单分组，不对应具体页面
- **2** - 菜单：对应前端页面
- **3** - 按钮：对应页面内的操作按钮权限

**SQL 建表语句：**
```sql
CREATE TABLE IF NOT EXISTS sys_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL DEFAULT 0,
  menu_name VARCHAR(50) NOT NULL,
  menu_type INTEGER NOT NULL,
  path VARCHAR(255),
  component VARCHAR(255),
  permission VARCHAR(100),
  icon VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1
);
```

---

### 4. sys_user_role - 用户角色关联表

存储用户与角色的多对多关系。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | integer | PK, AI | 主键 ID，自增 |
| user_id | integer | NOT NULL | 用户 ID |
| role_id | integer | NOT NULL | 角色 ID |

**SQL 建表语句：**
```sql
CREATE TABLE IF NOT EXISTS sys_user_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL
);
```

---

### 5. sys_role_menu - 角色菜单关联表

存储角色与菜单的多对多关系。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | integer | PK, AI | 主键 ID，自增 |
| role_id | integer | NOT NULL | 角色 ID |
| menu_id | integer | NOT NULL | 菜单 ID |

**SQL 建表语句：**
```sql
CREATE TABLE IF NOT EXISTS sys_role_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL
);
```

## 基础数据规则

### 1. 超级管理员角色

| 字段 | 值 |
|------|-----|
| role_code | SUPER_ADMIN |
| role_name | 超级管理员 |
| description | 拥有全部权限 |
| status | 1 |

### 2. 默认菜单结构

脚本会创建以下菜单树：

```
系统管理 (目录, 图标: Settings)
├── 用户管理 (菜单, 路径: /sys/user, 图标: User)
│   ├── 查询用户 (按钮, 权限: sys:user:query)
│   ├── 新增用户 (按钮, 权限: sys:user:add)
│   ├── 编辑用户 (按钮, 权限: sys:user:edit)
│   ├── 删除用户 (按钮, 权限: sys:user:delete)
│   └── 重置密码 (按钮, 权限: sys:user:resetPwd)
├── 角色管理 (菜单, 路径: /sys/role, 图标: Role)
│   ├── 查询角色 (按钮, 权限: sys:role:query)
│   ├── 新增角色 (按钮, 权限: sys:role:add)
│   ├── 编辑角色 (按钮, 权限: sys:role:edit)
│   └── 删除角色 (按钮, 权限: sys:role:delete)
└── 菜单管理 (菜单, 路径: /sys/menu, 图标: Menu)
    ├── 查询菜单 (按钮, 权限: sys:menu:query)
    ├── 新增菜单 (按钮, 权限: sys:menu:add)
    ├── 编辑菜单 (按钮, 权限: sys:menu:edit)
    └── 删除菜单 (按钮, 权限: sys:menu:delete)
```

### 3. 默认管理员账号

| 字段 | 值 |
|------|-----|
| user_name | admin |
| real_name | 超级管理员 |
| email | admin@example.com |
| password | Admin@123 |
| status | 1 |

**密码哈希值：**
```
$2a$10$jYriD6EK14jUM7W6H5zcleTpVbJVPORxjNXOJsnE0F7ImT0BskCW2
```

## 注意事项

### 1. 数据库文件位置

数据库文件默认位于：
```
scaffold/packages/api/data/app.db
```

脚本会自动创建 `data` 目录（如果不存在）。

### 2. 幂等性设计

脚本具有幂等性，可以安全地重复执行：

- ✅ 表已存在时不会重新创建（使用 `IF NOT EXISTS`）
- ✅ 角色已存在时不会重复创建
- ✅ 菜单已存在时不会重复创建
- ✅ admin 账号已存在时不会重复创建

### 3. 生产环境注意事项

**⚠️ 重要提醒：**

1. **修改默认密码**：生产环境必须修改 admin 账号的默认密码
2. **修改密钥**：生产环境必须修改 JWT_SECRET
3. **备份数据**：执行脚本前建议备份现有数据库
4. **权限控制**：生产环境建议设置数据库文件权限为只读（除应用进程外）

### 4. 常见问题

#### Q: 执行脚本后表没有创建？

A: 检查以下几点：
1. 确保有足够的文件系统权限
2. 检查数据库文件路径是否正确
3. 查看控制台错误信息

#### Q: 如何重置数据库？

A: 删除数据库文件后重新执行脚本：
```bash
# 删除数据库文件
rm scaffold/packages/api/data/app.db

# 重新初始化
cd scaffold/packages/api
pnpm init-db
```

#### Q: 如何修改默认密码？

A: 有两种方式：

**方式 1：通过 API 重置（推荐）**
```bash
# 先登录获取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# 使用 token 重置密码
curl -X PUT http://localhost:3001/api/sys/user/1/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"YourNewPassword@123"}'
```

**方式 2：直接修改数据库**
```typescript
// 使用 bcryptjs 生成新的哈希值
import bcrypt from 'bcryptjs';

const newPassword = 'YourNewPassword@123';
const hashedPassword = bcrypt.hashSync(newPassword, 10);
console.log('新的密码哈希:', hashedPassword);

// 然后使用 SQL 更新数据库
// UPDATE sys_user SET password_hash = '<新哈希>' WHERE user_name = 'admin';
```

#### Q: 如何添加自定义菜单？

A: 有两种方式：

**方式 1：通过 API 添加（推荐）**
使用菜单管理接口动态添加菜单。

**方式 2：修改初始化脚本**
编辑 `init-db.ts`，在菜单创建部分添加自定义菜单。

### 5. 扩展建议

如需扩展初始化脚本，可以考虑：

1. **添加更多默认角色**：如普通用户、访客等
2. **添加示例数据**：用于演示或测试
3. **添加数据验证**：检查现有数据的完整性
4. **添加数据迁移**：支持版本升级时的数据迁移

## 执行日志示例

成功执行脚本后，会看到类似以下输出：

```
✅ 表结构创建完成
✅ 超级管理员角色创建完成
✅ 默认菜单和权限创建完成
✅ 超级管理员角色权限分配完成
✅ admin 账号创建完成 (密码: Admin@123)

🎉 数据库初始化完成！
```

如果数据已存在，会看到：

```
✅ 表结构创建完成
ℹ️  admin 账号已存在，跳过

🎉 数据库初始化完成！
```
