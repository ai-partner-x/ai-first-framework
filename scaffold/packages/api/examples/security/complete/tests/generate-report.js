#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');
const REPORT_PATH = path.join(TEST_RESULTS_DIR, 'test-report.json');
const HTML_REPORT_PATH = path.join(TEST_RESULTS_DIR, 'test-report.html');

function generateHTMLReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('测试报告不存在，请先运行测试');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aiko Boot Security 测试报告</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    .header h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }

    .header p {
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
    }

    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }

    .summary-card h3 {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 10px;
    }

    .summary-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }

    .summary-card.success .value {
      color: #10b981;
    }

    .summary-card.warning .value {
      color: #f59e0b;
    }

    .summary-card.error .value {
      color: #ef4444;
    }

    .section {
      padding: 30px;
    }

    .section h2 {
      font-size: 1.5em;
      margin-bottom: 20px;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }

    .coverage-bar {
      margin: 20px 0;
    }

    .coverage-item {
      margin-bottom: 15px;
    }

    .coverage-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .progress-bar {
      height: 20px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .progress-fill.high {
      background: #10b981;
    }

    .progress-fill.medium {
      background: #f59e0b;
    }

    .progress-fill.low {
      background: #ef4444;
    }

    .test-list {
      list-style: none;
    }

    .test-item {
      padding: 15px;
      margin-bottom: 10px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .test-item.passed {
      border-left-color: #10b981;
    }

    .test-item.failed {
      border-left-color: #ef4444;
    }

    .test-item h4 {
      margin-bottom: 5px;
      color: #1f2937;
    }

    .test-item p {
      color: #6b7280;
      font-size: 0.9em;
    }

    .footer {
      text-align: center;
      padding: 20px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 0.9em;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
      margin-right: 5px;
    }

    .badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge.warning {
      background: #fef3c7;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aiko Boot Security 测试报告</h1>
      <p>生成时间: ${data.timestamp}</p>
      <p>环境: ${data.environment}</p>
    </div>

    <div class="summary">
      <div class="summary-card success">
        <h3>单元测试</h3>
        <div class="value">${data.tests.unit.passed}/${data.tests.unit.total}</div>
      </div>
      <div class="summary-card ${data.tests.integration.failed > 0 ? 'error' : 'success'}">
        <h3>集成测试</h3>
        <div class="value">${data.tests.integration.passed}/${data.tests.integration.total}</div>
      </div>
      <div class="summary-card ${data.tests.overall.failed > 0 ? 'error' : 'success'}">
        <h3>总测试数</h3>
        <div class="value">${data.tests.overall.passed}/${data.tests.overall.total}</div>
      </div>
      <div class="summary-card ${getCoverageClass(data.coverage.lines)}">
        <h3>代码覆盖率</h3>
        <div class="value">${data.coverage.lines.toFixed(1)}%</div>
      </div>
    </div>

    <div class="section">
      <h2>代码覆盖率</h2>
      <div class="coverage-bar">
        <div class="coverage-item">
          <div class="coverage-label">
            <span>语句覆盖率</span>
            <span>${data.coverage.statements.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${getCoverageClass(data.coverage.statements)}" style="width: ${data.coverage.statements}%"></div>
          </div>
        </div>
        <div class="coverage-item">
          <div class="coverage-label">
            <span>分支覆盖率</span>
            <span>${data.coverage.branches.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${getCoverageClass(data.coverage.branches)}" style="width: ${data.coverage.branches}%"></div>
          </div>
        </div>
        <div class="coverage-item">
          <div class="coverage-label">
            <span>函数覆盖率</span>
            <span>${data.coverage.functions.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${getCoverageClass(data.coverage.functions)}" style="width: ${data.coverage.functions}%"></div>
          </div>
        </div>
        <div class="coverage-item">
          <div class="coverage-label">
            <span>行覆盖率</span>
            <span>${data.coverage.lines.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${getCoverageClass(data.coverage.lines)}" style="width: ${data.coverage.lines}%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>测试详情</h2>
      <ul class="test-list">
        ${data.details.map(test => `
          <li class="test-item ${test.status}">
            <h4>
              ${test.name}
              <span class="badge ${test.status === 'passed' ? 'success' : 'error'}">${test.status}</span>
            </h4>
            <p>${test.description || ''}</p>
            ${test.duration ? `<p>耗时: ${test.duration}ms</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="footer">
      <p>由 Aiko Boot Security 自动生成</p>
    </div>
  </div>

  <script>
    function getCoverageClass(percentage) {
      if (percentage >= 80) return 'high';
      if (percentage >= 60) return 'medium';
      return 'low';
    }
  </script>
</body>
</html>
  `;

  fs.writeFileSync(HTML_REPORT_PATH, html);
  console.log(`HTML 报告已生成: ${HTML_REPORT_PATH}`);
}

function getCoverageClass(percentage) {
  if (percentage >= 80) return 'high';
  if (percentage >= 60) return 'medium';
  return 'low';
}

generateHTMLReport();
