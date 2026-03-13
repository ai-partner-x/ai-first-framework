# 测试报告

> 本目录存放单元测试的覆盖率报告和测试结果

## 测试运行结果

**测试时间**: 2026-03-13

**测试命令**: `vitest -c test1/vitest.config.ts run --coverage`

### 测试结果摘要

| 指标 | 结果 |
|------|------|
| 测试文件数 | 16 |
| 测试用例数 | 114 |
| 通过 | 114 |
| 失败 | 0 |
| 跳过 | 0 |

### 测试文件详情

| 文件 | 测试用例数 | 状态 |
|------|-----------|------|
| auth.controller.test.ts | 4 | ✅ 通过 |
| user.controller.test.ts | 9 | ✅ 通过 |
| role.controller.test.ts | 8 | ✅ 通过 |
| menu.controller.test.ts | 8 | ✅ 通过 |
| auth.service.test.ts | 9 | ✅ 通过 |
| user.service.test.ts | 14 | ✅ 通过 |
| role.service.test.ts | 12 | ✅ 通过 |
| menu.service.test.ts | 14 | ✅ 通过 |
| jwt.util.test.ts | 5 | ✅ 通过 |
| user.entity.test.ts | 3 | ✅ 通过 |
| role.entity.test.ts | 3 | ✅ 通过 |
| menu.entity.test.ts | 5 | ✅ 通过 |
| user.dto.test.ts | 6 | ✅ 通过 |
| role.dto.test.ts | 4 | ✅ 通过 |
| menu.dto.test.ts | 8 | ✅ 通过 |
| auth.dto.test.ts | 6 | ✅ 通过 |

### 代码覆盖率

#### 各模块覆盖率

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|-----------|-----------|-----------|---------|
| **controller** | **84.21%** | 77.77% | 100% | 84.21% |
| dto | 100% | 100% | 100% | 100% |
| entity | 76.99% | 60% | 60% | 76.99% |
| service | 93.37% | 87.9% | 96.96% | 93.37% |
| utils | 100% | 100% | 100% | 100% |

#### 详细文件覆盖率

| 文件 | 语句覆盖 | 分支覆盖 | 函数覆盖 | 行覆盖 |
|------|---------|---------|---------|--------|
| auth.controller.ts | 100% | 100% | 100% | 100% |
| user.controller.ts | 100% | 100% | 100% | 100% |
| role.controller.ts | 100% | 100% | 100% | 100% |
| menu.controller.ts | 100% | 100% | 100% | 100% |
| auth.dto.ts | 100% | 100% | 100% | 100% |
| menu.dto.ts | 100% | 100% | 100% | 100% |
| role.dto.ts | 100% | 100% | 100% | 100% |
| user.dto.ts | 100% | 100% | 100% | 100% |
| menu.entity.ts | 100% | 100% | 100% | 100% |
| role.entity.ts | 100% | 100% | 100% | 100% |
| user.entity.ts | 100% | 100% | 100% | 100% |
| auth.service.ts | 100% | 100% | 100% | 100% |
| menu.service.ts | 100% | 96.42% | 100% | 100% |
| role.service.ts | 100% | 87.87% | 100% | 100% |
| user.service.ts | 96.47% | 80% | 100% | 96.47% |
| jwt.util.ts | 100% | 100% | 100% | 100% |

## 目录结构

```
test1/
├── unit/                      # 单元测试目录
│   ├── auth.controller.test.ts  # 认证控制器测试
│   ├── user.controller.test.ts # 用户控制器测试
│   ├── role.controller.test.ts # 角色控制器测试
│   ├── menu.controller.test.ts # 菜单控制器测试
│   ├── user.entity.test.ts     # 用户实体测试
│   ├── role.entity.test.ts     # 角色实体测试
│   ├── menu.entity.test.ts     # 菜单实体测试
│   ├── user.dto.test.ts        # 用户 DTO 测试
│   ├── role.dto.test.ts        # 角色 DTO 测试
│   ├── menu.dto.test.ts        # 菜单 DTO 测试
│   ├── auth.dto.test.ts        # 认证 DTO 测试
│   ├── auth.service.test.ts    # 认证服务测试
│   ├── user.service.test.ts    # 用户服务测试
│   ├── role.service.test.ts    # 角色服务测试
│   ├── menu.service.test.ts    # 菜单服务测试
│   └── jwt.util.test.ts        # JWT 工具测试
├── test-reports/               # 测试报告目录
│   └── coverage/              # 覆盖率报告（HTML）
└── TEST_REPORT.md             # 测试报告记录
```

## 运行测试

```bash
cd scaffold/packages/api

# 运行所有测试
vitest -c test1/vitest.config.ts run

# 生成覆盖率报告
vitest -c test1/vitest.config.ts run --coverage
```

## 测试记录

| 日期 | 测试用例 | 覆盖率 | 状态 |
|------|----------|--------|------|
| 2026-03-13 | 114 | ~90% | ✅ 全部通过 |
