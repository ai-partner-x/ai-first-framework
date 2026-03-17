// ============================================================
// Vitest 配置文件
// 用途：配置单元测试框架 Vitest 的行为
// ============================================================

// 从 vitest/config 导入 defineConfig 函数
// 这是 Vitest 提供的配置函数，类似于 Vite 的配置方式
import { defineConfig } from 'vitest/config';

// 使用 defineConfig 导出配置对象
// Vitest 会读取这个配置来运行测试
export default defineConfig({
  // test 配置项：定义测试相关的配置
  test: {
    // globals: true
    // 开启全局模式，无需导入 describe/it/expect 等函数
    // 这些函数会自动成为全局可用
    // 相当于在每个测试文件顶部自动添加了：
    // import { describe, it, expect, vi, beforeEach } from 'vitest';
    globals: true,

    // environment: 'node'
    // 指定测试运行的环境
    // 'node' - 在 Node.js 环境中运行（不是浏览器）
    // 其他选项：'browser'（浏览器）、'happy-dom'（轻量 DOM）
    environment: 'node',

    // include: [...]
    // 指定要扫描的测试文件路径模式
    // Vitest 会查找匹配这些模式的文件并运行其中的测试
    // 'test1/**/*.test.ts' - test1 目录下所有 .test.ts 文件
    // 'src/**/*.test.ts' - src 目录下所有 .test.ts 文件
    // ** 表示匹配任意目录层级
    // * 表示匹配任意文件名
    include: ['test1/**/*.test.ts', 'src/**/*.test.ts'],

    // coverage: {...}
    // 代码覆盖率配置
    // 覆盖率可以了解有多少代码被测试覆盖
    coverage: {
      // provider: 'v8'
      // 使用 V8 引擎来收集覆盖率信息
      // V8 是 Node.js 内置的 JavaScript 引擎
      // 性能更好，收集信息更准确
      provider: 'v8',

      // reporter: [...]
      // 覆盖率报告的输出格式
      // 'text' - 在终端输出文本格式的覆盖率报告
      // 'json' - 输出 JSON 格式的报告（可被其他工具使用）
      // 'html' - 输出 HTML 格式的报告（可在浏览器中查看）
      reporter: ['text', 'json', 'html'],

      // outputDir: 'test1/test-reports'
      // 覆盖率报告输出到 test1/test-reports 目录
      outputDir: 'test1/test-reports',

      // include: [...]
      // 指定要统计覆盖率的代码目录
      include: [
        'src/controller/**/*.ts',
        'src/service/**/*.ts',
        'src/entity/**/*.ts',
        'src/dto/**/*.ts',
        'src/utils/**/*.ts',
      ],
    },
  },
});
