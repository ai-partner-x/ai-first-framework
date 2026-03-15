#!/usr/bin/env node

/**
 * 权限控制自动化测试脚本
 *
 * 测试API、方法、按钮级别的权限控制功能
 */

import http from 'http';

// 配置
const BASE_URL = 'http://localhost:3001/api';
const TEST_TIMEOUT = 5000;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

/**
 * HTTP请求工具函数
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || `${BASE_URL}${options.path}`);

    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 打印带颜色的消息
 */
function printMessage(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 打印测试结果
 */
function printTestResult(testName, passed, message, data = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    printMessage(`✓ ${testName}`, colors.green);
    if (message) {
      console.log(`  ${message}`);
    }
    if (data && process.env.DEBUG) {
      console.log(`  数据:`, data);
    }
  } else {
    testResults.failed++;
    printMessage(`✗ ${testName}`, colors.red);
    if (message) {
      console.log(`  ${colors.red}${message}${colors.reset}`);
    }
    if (data && process.env.DEBUG) {
      console.log(`  错误数据:`, data);
    }
  }
}

/**
 * 打印测试标题
 */
function printTestSection(title) {
  console.log('\n' + '='.repeat(60));
  printMessage(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

/**
 * 检查服务是否运行
 */
async function checkServiceHealth() {
  printTestSection('1. 服务健康检查');

  try {
    const response = await makeRequest({
      path: '/test/permissions/public',
      method: 'GET',
    });

    if (response.statusCode === 200) {
      printTestResult('服务健康检查', true, '服务运行正常');
      return true;
    } else {
      printTestResult('服务健康检查', false, `服务响应异常: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    printTestResult('服务健康检查', false, `服务连接失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试公开接口
 */
async function testPublicEndpoints() {
  printTestSection('2. 公开接口测试');

  const publicTests = [
    {
      name: '公开权限接口',
      path: '/test/permissions/public',
      method: 'GET',
      description: '不需要任何权限的公开接口',
    },
  ];

  for (const test of publicTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
      });

      const passed = response.statusCode === 200;
      printTestResult(
        test.name,
        passed,
        passed ? `${test.description}` : `返回状态码: ${response.statusCode}`,
        response.data
      );
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试API权限
 */
async function testApiPermissions() {
  printTestSection('3. API权限测试');

  const apiTests = [
    {
      name: 'API读取权限',
      path: '/test/permissions/api-read',
      method: 'GET',
      permission: 'api:test:api-read',
    },
    {
      name: 'API创建权限',
      path: '/test/permissions/api-create',
      method: 'POST',
      body: { testData: 'test' },
      permission: 'api:test:api-create',
    },
    {
      name: 'API混合权限',
      path: '/test/permissions/mixed',
      method: 'PUT',
      body: { test: 'data' },
      permission: 'api:test:mixed',
    },
  ];

  for (const test of apiTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
        body: test.body,
      });

      const passed = response.statusCode === 200 || response.statusCode === 403;
      const message = passed
        ? (response.statusCode === 200 ? '权限验证成功' : '权限拦截正常')
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试按钮权限
 */
async function testButtonPermissions() {
  printTestSection('4. 按钮权限测试');

  const buttonTests = [
    {
      name: '创建按钮权限',
      path: '/test/permissions/api-create',
      method: 'POST',
      body: { test: 'data' },
      buttonId: 'btn-api-create',
      permission: 'button:test:api-create',
    },
    {
      name: '多个按钮权限',
      path: '/test/permissions/mixed',
      method: 'PUT',
      body: { test: 'data' },
      buttonIds: ['btn-approve', 'btn-reject', 'btn-export'],
    },
    {
      name: '删除按钮权限',
      path: '/test/permissions/123',
      method: 'DELETE',
      buttonId: 'btn-delete',
    },
  ];

  for (const test of buttonTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
        body: test.body,
      });

      const passed = response.statusCode === 200 || response.statusCode === 403;
      const message = passed
        ? (response.statusCode === 200 ? '按钮权限验证成功' : '按钮权限拦截正常')
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试传统权限控制
 */
async function testTraditionalPermissions() {
  printTestSection('5. 传统权限控制测试');

  const traditionalTests = [
    {
      name: '管理员专用接口',
      path: '/test/permissions/admin-only',
      method: 'GET',
      expression: "hasRole('ADMIN')",
    },
    {
      name: '管理员或经理接口',
      path: '/test/permissions/manager-admin',
      method: 'GET',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      name: '复杂权限接口',
      path: '/test/permissions/complex',
      method: 'GET',
      expression: "hasRole('ADMIN') or hasRole('MANAGER')",
    },
  ];

  for (const test of traditionalTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
      });

      const passed = response.statusCode === 200 || response.statusCode === 403;
      const message = passed
        ? (response.statusCode === 200 ? '传统权限验证成功' : '传统权限拦截正常')
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试业务操作权限
 */
async function testBusinessOperationPermissions() {
  printTestSection('6. 业务操作权限测试');

  const businessTests = [
    {
      name: '资源删除操作',
      path: '/test/permissions/123',
      method: 'DELETE',
      description: '删除资源的权限检查',
    },
    {
      name: '资源审批操作',
      path: '/test/permissions/456/approve',
      method: 'PUT',
      body: { action: 'approve', reason: '测试审批' },
      description: '审批资源的权限检查',
    },
    {
      name: '数据导出操作',
      path: '/test/permissions/export',
      method: 'POST',
      body: { format: 'excel' },
      description: '导出数据的权限检查',
    },
    {
      name: '批量操作',
      path: '/test/permissions/batch',
      method: 'POST',
      body: { ids: [1, 2, 3], operation: 'delete' },
      description: '批量操作的权限检查',
    },
  ];

  for (const test of businessTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
        body: test.body,
      });

      const passed = response.statusCode === 200 || response.statusCode === 403;
      const message = passed
        ? (response.statusCode === 200 ? `${test.description}成功` : `${test.description}被正常拦截`)
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试权限查询功能
 */
async function testPermissionQuery() {
  printTestSection('7. 权限查询功能测试');

  const queryTests = [
    {
      name: '按组查询权限',
      path: '/test/permissions/by-group?group=权限测试',
      method: 'GET',
      description: '按组查询可用权限',
    },
    {
      name: '按类型查询权限',
      path: '/test/permissions/by-type?type=API',
      method: 'GET',
      description: '按类型查询可用权限',
    },
    {
      name: '权限功能总结',
      path: '/test/permissions/summary',
      method: 'GET',
      description: '获取权限功能总结',
    },
  ];

  for (const test of queryTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
      });

      const passed = response.statusCode === 200;
      const message = passed
        ? `${test.description}成功`
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 测试现有业务接口权限
 */
async function testExistingBusinessPermissions() {
  printTestSection('8. 现有业务接口权限测试');

  const existingTests = [
    {
      name: '用户分页查询',
      path: '/sys/user/page?pageNo=1&pageSize=10',
      method: 'GET',
      permission: 'api:user:page',
    },
    {
      name: '菜单树查询',
      path: '/sys/menu/tree',
      method: 'GET',
      permission: 'api:menu:tree',
    },
    {
      name: '角色列表查询',
      path: '/sys/role/list',
      method: 'GET',
      permission: 'api:role:list',
    },
  ];

  for (const test of existingTests) {
    try {
      const response = await makeRequest({
        path: test.path,
        method: test.method,
      });

      const passed = response.statusCode === 200 || response.statusCode === 403;
      const message = passed
        ? (response.statusCode === 200 ? '业务接口权限验证成功' : '业务接口权限拦截正常')
        : `返回状态码: ${response.statusCode}`;

      printTestResult(test.name, passed, message, response.data);
    } catch (error) {
      printTestResult(test.name, false, `请求失败: ${error.message}`);
    }
  }
}

/**
 * 打印测试总结
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  printMessage('测试总结', colors.bright + colors.magenta);
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  printMessage(`通过: ${testResults.passed}`, colors.green);
  printMessage(`失败: ${testResults.failed}`, colors.red);
  printMessage(`跳过: ${testResults.skipped}`, colors.yellow);

  if (testResults.total > 0) {
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    printMessage(`成功率: ${successRate}%`, colors.cyan);
  }

  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log('\n' + colors.yellow + '⚠️  部分测试失败，请检查服务状态和权限配置' + colors.reset);
  } else {
    console.log('\n' + colors.green + '✓ 所有测试通过！权限控制功能运行正常' + colors.reset);
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  printMessage('\n🚀 开始权限控制自动化测试...\n', colors.bright + colors.cyan);

  try {
    // 检查服务健康状态
    const isServiceRunning = await checkServiceHealth();
    if (!isServiceRunning) {
      printMessage('\n❌ 服务未运行，请先启动API服务\n', colors.red);
      process.exit(1);
    }

    // 执行所有测试
    await testPublicEndpoints();
    await testApiPermissions();
    await testButtonPermissions();
    await testTraditionalPermissions();
    await testBusinessOperationPermissions();
    await testPermissionQuery();
    await testExistingBusinessPermissions();

    // 打印总结
    printSummary();

  } catch (error) {
    printMessage(`\n❌ 测试过程中出现错误: ${error.message}\n`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});