// ============================================================
// Vitest 配置文件 - test1
// 用途：配置单元测试框架 Vitest 的行为（扩展版本）
// ============================================================

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test1/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      outputDir: 'test1/test-reports',
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
