#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      cwd: __dirname,
      encoding: 'utf8'
    });
    console.log(`✓ ${description} 完成`);
    return { success: true, output };
  } catch (error) {
    console.error(`✗ ${description} 失败`);
    return { success: false, error: error.message };
  }
}

function runAllTests() {
  ensureDirectoryExists(TEST_RESULTS_DIR);

  console.log('========================================');
  console.log('  Aiko Boot Security 完整测试套件');
  console.log('========================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tests: {
      unit: { passed: 0, failed: 0, total: 0, duration: 0 },
      integration: { passed: 0, failed: 0, total: 0, duration: 0 },
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
  const unitResult = runCommand(
    'pnpm jest --config=jest.config.js --testPathPattern=unit --coverage --coverageReporters=json-summary --verbose',
    '单元测试'
  );

  if (unitResult.success) {
    const unitOutput = unitResult.output;
    const unitMatches = unitOutput.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
    if (unitMatches) {
      results.tests.unit.passed = parseInt(unitMatches[1]);
      results.tests.unit.failed = parseInt(unitMatches[2]);
      results.tests.unit.total = results.tests.unit.passed + results.tests.unit.failed;
    }
  }

  console.log('\n2. 运行集成测试...');
  const integrationResult = runCommand(
    'pnpm jest --config=jest.config.js --testPathPattern=integration --verbose',
    '集成测试'
  );

  if (integrationResult.success) {
    const integrationOutput = integrationResult.output;
    const integrationMatches = integrationOutput.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
    if (integrationMatches) {
      results.tests.integration.passed = parseInt(integrationMatches[1]);
      results.tests.integration.failed = parseInt(integrationMatches[2]);
      results.tests.integration.total = results.tests.integration.passed + results.tests.integration.failed;
    }
  }

  console.log('\n3. 收集覆盖率数据...');
  try {
    const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      results.coverage = coverageData.total;
    }
  } catch (error) {
    console.warn('无法读取覆盖率数据');
  }

  results.tests.overall.passed = results.tests.unit.passed + results.tests.integration.passed;
  results.tests.overall.failed = results.tests.unit.failed + results.tests.integration.failed;
  results.tests.overall.total = results.tests.unit.total + results.tests.integration.total;

  console.log('\n4. 保存测试结果...');
  const reportPath = path.join(TEST_RESULTS_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('\n========================================');
  console.log('  测试摘要');
  console.log('========================================');
  console.log(`单元测试: ${results.tests.unit.passed}/${results.tests.unit.total} 通过`);
  console.log(`集成测试: ${results.tests.integration.passed}/${results.tests.integration.total} 通过`);
  console.log(`总测试数: ${results.tests.overall.passed}/${results.tests.overall.total} 通过`);
  console.log(`代码覆盖率: ${results.coverage.lines.toFixed(1)}%`);
  console.log('========================================\n');

  console.log('5. 生成 HTML 报告...');
  try {
    execSync('node generate-report.js', { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.warn('HTML 报告生成失败');
  }

  if (results.tests.overall.failed === 0) {
    console.log('✓ 所有测试通过！');
    process.exit(0);
  } else {
    console.log(`✗ ${results.tests.overall.failed} 个测试失败`);
    process.exit(1);
  }
}

runAllTests();
