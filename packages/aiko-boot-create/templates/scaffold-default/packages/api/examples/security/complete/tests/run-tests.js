#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');
const COVERAGE_DIR = path.join(__dirname, '../coverage');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✓ ${description} 完成`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} 失败`);
    return false;
  }
}

function generateTestReport() {
  ensureDirectoryExists(TEST_RESULTS_DIR);
  ensureDirectoryExists(COVERAGE_DIR);

  console.log('========================================');
  console.log('  Aiko Boot Security 测试报告生成器');
  console.log('========================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tests: {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      overall: { passed: 0, failed: 0, total: 0, duration: 0 },
    },
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
    details: [],
  };

  console.log('1. 运行单元测试...');
  const unitSuccess = runCommand(
    'npm run test:unit',
    '单元测试'
  );

  console.log('\n2. 运行集成测试...');
  const integrationSuccess = runCommand(
    'npm run test:integration',
    '集成测试'
  );

  console.log('\n3. 生成覆盖率报告...');
  const coverageSuccess = runCommand(
    'npm run test:coverage',
    '覆盖率报告'
  );

  console.log('\n4. 收集测试结果...');

  try {
    const coverageSummaryPath = path.join(COVERAGE_DIR, 'coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      results.coverage = coverageData.total;
    }
  } catch (error) {
    console.warn('无法读取覆盖率数据');
  }

  console.log('\n5. 生成测试报告...');
  const reportPath = path.join(TEST_RESULTS_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('\n========================================');
  console.log('  测试摘要');
  console.log('========================================');
  console.log(`单元测试: ${unitSuccess ? '✓ 通过' : '✗ 失败'}`);
  console.log(`集成测试: ${integrationSuccess ? '✓ 通过' : '✗ 失败'}`);
  console.log(`覆盖率报告: ${coverageSuccess ? '✓ 已生成' : '✗ 失败'}`);
  console.log(`报告路径: ${reportPath}`);
  console.log('========================================\n');

  if (unitSuccess && integrationSuccess && coverageSuccess) {
    console.log('✓ 所有测试通过！');
    process.exit(0);
  } else {
    console.log('✗ 部分测试失败');
    process.exit(1);
  }
}

generateTestReport();
