# 登录接口用户名和密码存储位置说明

## 数据库位置

用户名和密码保存在 **SQLite 数据库**中：

```
app/framework/admin-app/packages/api/data/app.db
```

## 数据流程

### 1. 登录接口

文件：`auth.controller.ts` 第11-13行

```typescript
@PostMapping('/login')
async login(@RequestBody() dto: LoginDto) {
  console.log('login dto', dto);
  return this.authService.login(dto.username, dto.password);
}
```

- 接收用户名和密码
- 调用 `authService.login()`

### 2. 认证服务

文件：`auth.service.ts` 第30-42行

```typescript
async login(username: string, password: string): Promise<TokenVo> {
  const user = await this.userMapper.selectByUsername(username);
  if (!user) throw new Error('用户名或密码错误');
  if (user.status === 0) throw new Error('账户已被禁用');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('用户名或密码错误');

  // ... 生成 token
}
```

- 通过 `userMapper.selectByUsername(username)` 查询用户
- 使用 `bcrypt.compare(password, user.password)` 验证密码

### 3. 数据存储

- 表名：`sys_user`
- 密码：使用 bcrypt 加密存储

## 默认账号

默认账号在数据库初始化脚本中创建：

文件：`init-db.ts` 第95-99行

```typescript
const hashed = await bcrypt.hash('Admin@123', 10);
const result = await db.insertInto('sys_user')
  .values({ username: 'admin', password: hashed, real_name: '超级管理员', status: 1, ... })
  .executeTakeFirst();
```

| 字段 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `Admin@123` |
{"username":"admin","password":"Admin@123"}

## 相关文件

| 文件 | 作用 |
|------|------|
| `entity/sys-user.entity.ts` | 用户实体定义 |
| `mapper/sys-user.mapper.ts` | 用户数据访问 |
| `scripts/init-db.ts` | 数据库初始化 |
| `service/auth.service.ts` | 认证服务逻辑 |
| `controller/auth.controller.ts` | 登录接口控制器 |

## 数据库表结构

```sql
CREATE TABLE sys_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  status INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
);
```
