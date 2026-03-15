#!/usr/bin/env node

/**
 * 权限控制功能演示脚本
 *
 * 演示各种权限控制功能的使用
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001/api';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * 打印带颜色的消息
 */
function printMessage(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 打印分隔线
 */
function printSeparator(title = '') {
  console.log('\n' + '='.repeat(70));
  if (title) {
    printMessage(title, colors.bright + colors.cyan);
  }
  console.log('='.repeat(70));
}

/**
 * HTTP请求工具函数
 */
async function makeRequest(options) {
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
            data: JSON.parse(data),
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 演示1：权限类型系统
 */
async function demoPermissionTypes() {
  printSeparator('演示1：权限类型系统');

  printMessage('\n📋 Aiko Boot 支持5种权限类型：\n', colors.bright + colors.magenta);

  const types = [
    { type: 'API', description: 'API端点权限，控制HTTP接口访问', example: 'api:user:read' },
    { type: 'METHOD', description: '方法权限，控制Service层方法调用', example: 'method:user:create' },
    { type: 'BUTTON', description: '按钮权限，控制前端按钮显示和操作', example: 'button:user:delete' },
    { type: 'MENU', description: '菜单权限，控制菜单显示和访问', example: 'menu:user' },
    { type: 'OTHER', description: '其他自定义权限', example: 'other:custom' },
  ];

  types.forEach(({ type, description, example }, index) => {
    printMessage(`${index + 1}. ${type} - ${description}`, colors.bright + colors.yellow);
    printMessage(`   示例：${example}`, colors.cyan);
    console.log('');
  });
}

/**
 * 演示2：API权限控制
 */
async function demoApiPermissions() {
  printSeparator('演示2：API权限控制');

  printMessage('\n🔒 API权限用于控制HTTP端点的访问\n', colors.bright + colors.blue);

  const apiEndpoints = [
    { method: 'GET', path: '/api/sys/user/page', permission: 'api:user:page', description: '用户分页列表' },
    { method: 'GET', path: '/api/sys/menu/tree', permission: 'api:menu:tree', description: '菜单树' },
    { method: 'GET', path: '/api/sys/role/list', permission: 'api:role:list', description: '角色列表' },
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest({
        path: endpoint.path,
        method: endpoint.method,
      });

      printMessage(`✅ ${endpoint.description}`, colors.green);
      printMessage(`   接口: ${endpoint.method} ${endpoint.path}`, colors.cyan);
      printMessage(`   权限: ${endpoint.permission}`, colors.cyan);
      printMessage(`   状态: ${response.statusCode}`, colors.cyan);
      console.log('');
    } catch (error) {
      printMessage(`❌ ${endpoint.description} 失败: ${error.message}`, colors.red);
      console.log('');
    }
  }
}

/**
 * 演示3：混合权限（API + 按钮）
 */
async function demoMixedPermissions() {
  printSeparator('演示3：混合权限（API + 按钮）');

  printMessage('\n🎯 混合权限支持同时使用API权限和多个按钮权限\n', colors.bright + colors.magenta);

  const mixedExamples = [
    {
      method: 'POST',
      path: '/api/sys/user',
      apiPermission: 'api:user:create',
      buttonPermissions: ['button:user:create'],
      description: '创建用户（API权限 + 创建按钮）',
    },
    {
      method: 'DELETE',
      path: '/api/sys/user/123',
      apiPermission: 'api:user:delete',
      buttonPermissions: ['button:user:delete'],
      description: '删除用户（API权限 + 删除按钮）',
    },
    {
      method: 'PUT',
      path: '/api/sys/user/456/password',
      apiPermission: 'api:user:reset-password',
      buttonPermissions: ['button:user:reset-password'],
      description: '重置密码（API权限 + 重置按钮）',
    },
  ];

  for (const example of mixedExamples) {
    printMessage(`📌 ${example.description}`, colors.bright + colors.yellow);
    printMessage(`   API权限: ${example.apiPermission}`, colors.cyan);
    printMessage(`   按钮权限: ${example.buttonPermissions.join(', ')}`, colors.cyan);
    printMessage(`   接口: ${example.method} ${example.path}`, colors.cyan);
    console.log('');
  }
}

/**
 * 演示4：传统权限控制
 */
async function demoTraditionalPermissions() {
  printSeparator('演示4：传统权限控制');

  printMessage('\n🔐 传统权限控制支持角色和表达式权限\n', colors.bright + colors.blue);

  const traditionalExamples = [
    {
      path: '/api/test/permissions/admin-only',
      method: 'GET',
      expression: "hasRole('ADMIN')",
      description: '管理员专用接口',
    },
    {
      path: '/api/test/permissions/manager-admin',
      method: 'GET',
      roles: ['MANAGER', 'ADMIN'],
      description: '管理员或经理接口',
    },
    {
      path: '/api/test/permissions/complex',
      method: 'GET',
      expression: "hasRole('ADMIN') or hasRole('MANAGER')",
      description: '复杂表达式权限',
    },
  ];

  for (const example of traditionalExamples) {
    try {
      const response = await makeRequest({
        path: example.path,
        method: example.method,
      });

      printMessage(`✅ ${example.description}`, colors.green);
      if (example.expression) {
        printMessage(`   表达式: ${example.expression}`, colors.cyan);
      }
      if (example.roles) {
        printMessage(`   角色: ${example.roles.join(', ')}`, colors.cyan);
      }
      printMessage(`   接口: ${example.method} ${example.path}`, colors.cyan);
      printMessage(`   状态: ${response.statusCode}`, colors.cyan);
      console.log('');
    } catch (error) {
      printMessage(`❌ ${example.description} 失败: ${error.message}`, colors.red);
      console.log('');
    }
  }
}

/**
 * 演示5：权限查询功能
 */
async function demoPermissionQueries() {
  printSeparator('演示5：权限查询功能');

  printMessage('\n🔍 权限查询功能支持按类型和组查询\n', colors.bright + colors.blue);

  const queryExamples = [
    {
      path: '/api/test/permissions/by-group?group=权限测试',
      method: 'GET',
      description: '按组查询权限',
    },
    {
      path: '/api/test/permissions/by-type?type=BUTTON',
      method: 'GET',
      description: '按类型查询按钮权限',
    },
    {
      path: '/api/test/permissions/summary',
      method: 'GET',
      description: '获取权限功能总结',
    },
  ];

  for (const example of queryExamples) {
    try {
      const response = await makeRequest({
        path: example.path,
        method: example.method,
      });

      printMessage(`✅ ${example.description}`, colors.green);
      printMessage(`   接口: ${example.method} ${example.path}`, colors.cyan);
      printMessage(`   状态: ${response.statusCode}`, colors.cyan);
      if (response.data && response.data.data) {
        const data = response.data.data;
        if (data.availableGroups) {
          printMessage(`   可用组: ${data.availableGroups.join(', ')}`, colors.cyan);
        }
        if (data.availableTypes) {
          printMessage(`   可用类型: ${data.availableTypes.join(', ')}`, colors.cyan);
        }
      }
      console.log('');
    } catch (error) {
      printMessage(`❌ ${example.description} 失败: ${error.message}`, colors.red);
      console.log('');
    }
  }
}

/**
 * 演示6：前端权限检查
 */
async function demoFrontendPermissionCheck() {
  printSeparator('演示6：前端权限检查');

  printMessage('\n💻 前端权限检查组件使用示例\n', colors.bright + colors.magenta);

  const frontendExamples = [
    {
      title: 'React 权限检查组件',
      code: `<PermissionCheck permissionCode="api:user:create">
  <Button onClick={() => navigate('/users')}>创建用户</Button>
</PermissionCheck>`,
      description: '只有有创建用户权限的用户才能看到按钮',
    },
    {
      title: '条件按钮渲染',
      code: `{hasCreatePermission && (
  <Button onClick={() => createUser()}>创建用户</Button>
)}`,
      description: '根据权限状态条件渲染按钮',
    },
    {
      title: '批量权限检查',
      code: `const permissionCheck = await checkMultiplePermissions([
  'api:user:create',
  'api:user:delete',
  'api:user:export',
]);`,
      description: '一次性检查多个权限',
    },
  ];

  frontendExamples.forEach(({ title, code, description }, index) => {
    printMessage(`${index + 1}. ${title}`, colors.bright + colors.yellow);
    printMessage(`   ${description}`, colors.cyan);
    printMessage(`   代码:`, colors.cyan);
    console.log(`   ${colors.green}${code}${colors.reset}`);
    console.log('');
  });
}

/**
 * 演示7：实际业务场景
 */
async function demoBusinessScenarios() {
  printSeparator('演示7：实际业务场景');

  printMessage('\n🏢 实际业务场景的权限控制应用\n', colors.bright + colors.blue);

  const businessScenarios = [
    {
      scenario: '用户管理场景',
      endpoints: [
        'GET /api/sys/user/page - 查看用户列表 (api:user:page)',
        'POST /api/sys/user - 创建用户 (api:user:create + button:user:create)',
        'PUT /api/sys/user/:id - 更新用户 (api:user:update + button:user:update)',
        'DELETE /api/sys/user/:id - 删除用户 (api:user:delete + button:user:delete)',
        'PUT /api/sys/user/:id/password - 重置密码 (api:user:reset-password + button:user:reset-password)',
      ],
    },
    {
      scenario: '订单审批场景',
      endpoints: [
        'GET /api/orders - 查看订单列表 (api:order:read)',
        'POST /api/orders - 创建订单 (api:order:create + button:order:create)',
        'PUT /api/orders/:id/approve - 审批订单 (api:order:approve + button:order:approve, button:order:reject)',
        'POST /api/orders/export - 导出订单 (api:order:export + button:order:export)',
      ],
    },
    {
      scenario: '菜单管理场景',
      endpoints: [
        'GET /api/sys/menu/tree - 查看菜单树 (api:menu:tree)',
        'POST /api/sys/menu - 创建菜单 (api:menu:create + button:menu:create)',
        'PUT /api/sys/menu/:id - 更新菜单 (api:menu:update + button:menu:update)',
        'DELETE /api/sys/menu/:id - 删除菜单 (api:menu:delete + button:menu:delete)',
      ],
    },
  ];

  businessScenarios.forEach(({ scenario, endpoints }, scenarioIndex) => {
    printMessage(`场景 ${scenarioIndex + 1}: ${scenario}`, colors.bright + colors.magenta);
    endpoints.forEach((endpoint, index) => {
      printMessage(`   ${index + 1}. ${endpoint}`, colors.cyan);
    });
    console.log('');
  });
}

/**
 * 主函数
 */
async function main() {
  printMessage('\n🎨 Aiko Boot 权限控制功能演示\n', colors.bright + colors.green);

  try {
    // 运行所有演示
    await demoPermissionTypes();
    await demoApiPermissions();
    await demoMixedPermissions();
    await demoTraditionalPermissions();
    await demoPermissionQueries();
    await demoFrontendPermissionCheck();
    await demoBusinessScenarios();

    printSeparator('演示完成');
    printMessage('\n✨ 权限控制功能演示完成！\n', colors.bright + colors.green);
    printMessage('Aiko Boot 框架现在具备完整的细粒度权限控制能力！\n', colors.bright + colors.cyan);

  } catch (error) {
    printMessage(`\n❌ 演示过程中出现错误: ${error.message}\n`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// 运行演示
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});