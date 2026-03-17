# 测试报告

> 本目录存放单元测试的覆盖率报告和测试结果

## 测试运行结果

**测试时间**: 2026-03-13

**测试命令**: `pnpm test:coverage`

### 测试结果摘要

| 指标 | 结果 |
|------|------|
| 测试文件数 | 5 |
| 测试用例数 | 55 |
| 通过 | 55 |
| 失败 | 0 |
| 跳过 | 0 |

### 测试文件详情

| 文件 | 测试用例数 | 状态 |
|------|-----------|------|
| auth.service.test.ts | 9 | ✅ 通过 |
| user.service.test.ts | 14 | ✅ 通过 |
| role.service.test.ts | 12 | ✅ 通过 |
| menu.service.test.ts | 14 | ✅ 通过 |
| jwt.util.test.ts | 5 | ✅ 通过 |

### 代码覆盖率

| 文件 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|-----------|-----------|-----------|---------|
| auth.service.ts | 100% | 100% | 100% | 100% |
| user.service.ts | 96.47% | 80% | 100% | 96.47% |
| role.service.ts | 100% | 87.87% | 100% | 100% |
| menu.service.ts | 100% | 96.42% | 100% | 100% |
| jwt.util.ts | 100% | 100% | 100% | 100% |

## 目录结构

```
test/
├── unit/                      # 单元测试目录
│   ├── auth.service.test.ts   # 认证服务测试
│   ├── user.service.test.ts   # 用户服务测试
│   ├── role.service.test.ts   # 角色服务测试
│   ├── menu.service.test.ts   # 菜单服务测试
│   └── jwt.util.test.ts       # JWT 工具测试
├── test-reports/              # 测试报告目录
│   └── coverage/              # 覆盖率报告（HTML 可在浏览器打开）
│       ├── index.html         # 覆盖率报告首页
│       └── ...
└── TEST_REPORT.md             # 测试报告记录
```

## 运行测试

```bash
cd scaffold/packages/api

# 运行所有测试
pnpm test

# 监听模式运行测试（开发时使用）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 覆盖率报告

覆盖率报告生成在 `test/test-reports/coverage/` 目录：

- `index.html` - HTML 格式覆盖率报告（可在浏览器打开查看）
- `coverage-final.json` - JSON 格式覆盖率数据

## 测试记录

| 日期 | 测试用例 | 覆盖率 | 状态 |
|------|----------|--------|------|
| 2026-03-13 | 55 | 93.37% | ✅ 全部通过 |
