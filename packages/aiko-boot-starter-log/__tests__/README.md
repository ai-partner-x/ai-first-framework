# aiko-boot-starter-log 测试指南

## 概述

本目录包含 `@ai-partner-x/aiko-boot-starter-log` 模块的完整单元测试和集成测试。测试使用 [Vitest](https://vitest.dev/) 框架，这是一个快速、现代化的测试运行器。

## 测试结构

```
__tests__/
├── README.md                    # 测试指南
├── setup.ts                     # 测试环境设置
├── logger.test.ts              # Logger 类测试
├── loggerFactory.test.ts       # LoggerFactory 类测试
├── formatter.test.ts           # Formatter 类测试
├── facade.test.ts              # 门面函数测试
├── auto-configuration.test.ts  # 自动配置测试
├── types.test.ts               # 类型定义测试
└── integration.test.ts         # 集成测试
```

## 运行测试

### 安装依赖

首先确保已安装测试依赖：

```bash
npm install
```

### 运行所有测试

```bash
npm test
# 或
npm run test
```

### 监听模式运行测试

```bash
npm run test:watch
```

### 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告将生成在 `coverage/` 目录中。

### 使用 UI 界面运行测试

```bash
npm run test:ui
```

## 测试覆盖范围

### 1. Logger 类测试 (`logger.test.ts`)
- 创建 Logger 实例
- 不同级别的日志记录
- 带元数据的日志
- 错误处理
- 子记录器和上下文
- SLF4J 风格级别检查

### 2. LoggerFactory 类测试 (`loggerFactory.test.ts`)
- 单例模式
- 记录器创建和获取
- 工厂配置
- 全局级别设置
- 多传输器支持

### 3. Formatter 类测试 (`formatter.test.ts`)
- 各种格式器创建（JSON、简单、漂亮、CLI）
- 生产/开发环境格式器
- 自定义格式化选项
- 时间戳和颜色选项

### 4. 门面函数测试 (`facade.test.ts`)
- 公共 API 函数测试
- 默认记录器
- 初始化配置
- 控制台、文件、组合记录器
- 全局级别设置
- 自动初始化

### 5. 自动配置测试 (`auto-configuration.test.ts`)
- LogAutoConfiguration 类
- LoggingProperties 类
- 配置加载和缓存
- 工厂函数
- 配置映射
- 缺失依赖处理

### 6. 类型定义测试 (`types.test.ts`)
- 类型定义验证
- 常量检查
- 接口兼容性
- 联合类型测试

### 7. 集成测试 (`integration.test.ts`)
- 完整生命周期测试
- 多记录器实例
- 复杂元数据处理
- 并发日志记录
- 错误边界情况
- 重新初始化

## 测试环境设置

测试环境在 `setup.ts` 中配置，包括：

1. **控制台模拟**：避免测试输出干扰
2. **测试辅助函数**：提供创建模拟对象的方法
3. **清理机制**：确保测试之间的隔离

## 编写新测试

### 基本测试结构

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { SomeClass } from '../src/some-class';

describe('SomeClass', () => {
  let instance: SomeClass;
  
  beforeEach(() => {
    instance = new SomeClass();
  });
  
  afterEach(() => {
    // 清理工作
  });
  
  test('应该正确工作', () => {
    expect(instance.doSomething()).toBe(expectedValue);
  });
});
```

### 测试异步代码

```typescript
test('应该正确处理异步操作', async () => {
  const result = await instance.asyncMethod();
  expect(result).toBeDefined();
});
```

### 模拟依赖

```typescript
import { vi } from 'vitest';

test('应该调用依赖方法', () => {
  const mockDependency = {
    method: vi.fn()
  };
  
  instance.useDependency(mockDependency);
  expect(mockDependency.method).toHaveBeenCalled();
});
```

## 测试最佳实践

1. **测试隔离**：每个测试应该独立运行，不依赖其他测试的状态
2. **描述性名称**：测试名称应该清晰描述测试内容
3. **断言明确**：每个测试应该有明确的断言
4. **错误处理**：测试应该验证错误情况
5. **边界情况**：测试应该覆盖边界情况和异常输入

## 调试测试

### 使用调试器

```bash
# 在 VS Code 中，可以配置调试配置
# 或使用 node --inspect 运行测试
```

### 控制台输出

在测试中可以使用 `console.log`，但在 `setup.ts` 中默认被模拟。如果需要查看输出，可以临时禁用模拟：

```typescript
// 在测试文件中
import { vi } from 'vitest';

test('调试测试', () => {
  vi.spyOn(console, 'log').mockRestore(); // 恢复原始 console.log
  console.log('调试信息');
});
```

## 覆盖率要求

- 语句覆盖率：≥ 80%
- 分支覆盖率：≥ 75%
- 函数覆盖率：≥ 85%
- 行覆盖率：≥ 80%

运行 `npm run test:coverage` 查看当前覆盖率。

## 持续集成

测试可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
```

## 故障排除

### 测试失败常见原因

1. **依赖问题**：确保所有依赖已正确安装
2. **环境问题**：检查 Node.js 版本和操作系统兼容性
3. **模拟问题**：确保模拟正确设置和清理
4. **异步问题**：确保异步测试正确等待结果

### 获取帮助

如果遇到测试问题，可以：

1. 检查测试日志输出
2. 运行单个测试文件：`npx vitest run __tests__/specific.test.ts`
3. 查看 Vitest 文档：https://vitest.dev/guide/

## 更新测试

当模块功能变更时，需要相应更新测试：

1. 添加新功能测试
2. 更新现有测试以反映变更
3. 确保所有测试通过
4. 更新覆盖率报告