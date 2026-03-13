# Scaffold 目录变更总结(晁念业)

> 基于 commit `92169d2` 的变更记录

---

### 修改的文件

| 文件 | 变更 |
|------|------|
| `scaffold/packages/api/package.json` | 添加 bcryptjs、jsonwebtoken、aiko-boot-starter-storage、aiko-boot-starter-mq 依赖 |
| `scaffold/packages/api/src/controller/auth.controller.ts` | 添加获取用户信息接口 |
| `scaffold/packages/api/src/dto/auth.dto.ts` | 添加 LoginResultDto 类型定义 |
| `scaffold/packages/api/src/entity/user.entity.ts` | 添加 passwordHash 字段 |
| `scaffold/packages/api/src/mapper/user.mapper.ts` | 添加 selectByUsername 方法 |
| `scaffold/packages/api/src/scripts/init-db.ts` | 添加用户、角色、菜单表初始化脚本 |
| `scaffold/packages/api/src/service/auth.service.ts` | 添加登录、获取用户信息、权限查询逻辑 |
| `scaffold/pnpm-workspace.yaml` | 添加 scaffold 到 workspace |

---

### 新增的文件

| 文件 | 说明 |
|------|------|
| `scaffold/packages/api/src/controller/menu.controller.ts` | 菜单管理控制器，提供菜单 CRUD API |
| `scaffold/packages/api/src/controller/role.controller.ts` | 角色管理控制器，提供角色 CRUD API |
| `scaffold/packages/api/src/controller/user.controller.ts` | 用户管理控制器，提供用户 CRUD API |
| `scaffold/packages/api/src/dto/menu.dto.ts` | 菜单相关 DTO（CreateMenuDto、UpdateMenuDto、MenuTreeVo） |
| `scaffold/packages/api/src/dto/role.dto.ts` | 角色相关 DTO（CreateRoleDto、UpdateRoleDto） |
| `scaffold/packages/api/src/dto/user.dto.ts` | 用户相关 DTO（CreateUserDto、UpdateUserDto、UserPageDto、UserVo） |
| `scaffold/packages/api/src/entity/menu.entity.ts` | 菜单实体定义 |
| `scaffold/packages/api/src/entity/role-menu.entity.ts` | 角色菜单关联实体 |
| `scaffold/packages/api/src/entity/role.entity.ts` | 角色实体定义 |
| `scaffold/packages/api/src/entity/user-role.entity.ts` | 用户角色关联实体 |
| `scaffold/packages/api/src/mapper/menu.mapper.ts` | 菜单 Mapper |
| `scaffold/packages/api/src/mapper/role-menu.mapper.ts` | 角色菜单关联 Mapper |
| `scaffold/packages/api/src/mapper/role.mapper.ts` | 角色 Mapper |
| `scaffold/packages/api/src/mapper/user-role.mapper.ts` | 用户角色关联 Mapper |
| `scaffold/packages/api/src/service/menu.service.ts` | 菜单业务逻辑 |
| `scaffold/packages/api/src/service/role.service.ts` | 角色业务逻辑 |
| `scaffold/packages/api/src/service/user.service.ts` | 用户业务逻辑（分页查询、CRUD、密码重置） |
| `scaffold/packages/api/src/utils/auth.utils.js` | 认证工具函数占位 |
| `scaffold/packages/api/src/utils/jwt.util.ts` | JWT 工具函数（签名、验证） |
