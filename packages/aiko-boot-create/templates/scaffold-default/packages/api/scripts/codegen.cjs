#!/usr/bin/env node
const { generateApiClient, watchApiClient } = require('@ai-partner-x/aiko-boot-codegen');

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
const isForce = process.argv.includes('--force') || process.argv.includes('-f');

function handleError(error) {
  console.error('\n❌ 代码生成失败:', error.message);
  console.error('\n请检查以下问题：');
  console.error('1. 源文件路径是否正确');
  console.error('2. TypeScript 代码是否有语法错误');
  console.error('3. 依赖是否正确安装');
  console.error('\n详细错误信息:', error.stack);
  process.exit(1);
}

if (isWatch) {
  try {
    watchApiClient();
  } catch (error) {
    handleError(error);
  }
} else {
  try {
    generateApiClient({ force: isForce });
  } catch (error) {
    handleError(error);
  }
}
