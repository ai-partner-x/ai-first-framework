/**
 * 高级权限控制示例
 *
 * 演示如何使用API、方法、按钮级别的权限控制
 */
import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { Service } from '@ai-partner-x/aiko-boot';
import { PermissionType, Public, PreAuthorize } from '@ai-partner-x/aiko-boot-starter-security';

/**
 * 用户管理控制器 - 演示API权限控制
 */
@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  /**
   * 查询用户列表 - 使用API权限装饰器
   *
   * 权限码：api:user:read
   */
  @GetMapping()
  @ApiPermission('user', 'read', {
    description: '查看用户列表',
    group: '用户管理',
  })
  async list(): Promise<any[]> {
    return this.userService.findAll();
  }

  /**
   * 创建用户 - 使用API权限装饰器
   *
   * 权限码：api:user:create
   */
  @PostMapping()
  @ApiPermission('user', 'create', {
    description: '创建用户',
    group: '用户管理',
  })
  async create(@RequestBody() userData: any): Promise<any> {
    return this.userService.create(userData);
  }

  /**
   * 更新用户 - 使用API权限装饰器
   *
   * 权限码：api:user:update
   */
  @PutMapping('/:id')
  @ApiPermission('user', 'update', {
    description: '更新用户信息',
    group: '用户管理',
  })
  async update(@PathVariable('id') id: number, @RequestBody() userData: any): Promise<any> {
    return this.userService.update(id, userData);
  }

  /**
   * 删除用户 - 使用API权限装饰器
   *
   * 权限码：api:user:delete
   */
  @DeleteMapping('/:id')
  @ApiPermission('user', 'delete', {
    description: '删除用户',
    group: '用户管理',
  })
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.userService.delete(id);
  }

  /**
   * 重置密码 - 混合使用API权限和按钮权限
   *
   * API权限：api:user:reset-password
   * 按钮权限：button:user:reset-password（用于前端按钮控制）
   */
  @PostMapping('/:id/reset-password')
  @ApiPermission('user', 'reset-password', {
    description: '重置用户密码',
    group: '用户管理',
  })
  @ButtonPermission('user', 'reset-password', {
    description: '重置密码按钮',
    group: '用户管理',
    buttonId: 'btn-reset-password',
  })
  async resetPassword(@PathVariable('id') id: number, @RequestBody() body: { newPassword: string }): Promise<void> {
    return this.userService.resetPassword(id, body.newPassword);
  }
}

/**
 * 订单管理控制器 - 演示按钮权限控制
 */
@RestController({ path: '/orders' })
export class OrderController {
  @Autowired()
  private orderService!: OrderService;

  /**
   * 查询订单列表 - 包含多个按钮权限定义
   *
   * API权限：api:order:read
   * 按钮权限：button:order:export, button:order:print
   */
  @GetMapping()
  @ApiPermission('order', 'read', {
    description: '查看订单列表',
    group: '订单管理',
  })
  @ButtonPermission('order', 'export', {
    description: '导出订单按钮',
    group: '订单管理',
    buttonId: 'btn-export-orders',
  })
  @ButtonPermission('order', 'print', {
    description: '打印订单按钮',
    group: '订单管理',
    buttonId: 'btn-print-orders',
  })
  async list(): Promise<any[]> {
    return this.orderService.findAll();
  }

  /**
   * 创建订单
   *
   * API权限：api:order:create
   * 按钮权限：button:order:create
   */
  @PostMapping()
  @ApiPermission('order', 'create', {
    description: '创建订单',
    group: '订单管理',
  })
  @ButtonPermission('order', 'create', {
    description: '创建订单按钮',
    group: '订单管理',
    buttonId: 'btn-create-order',
  })
  async create(@RequestBody() orderData: any): Promise<any> {
    return this.orderService.create(orderData);
  }

  /**
   * 审核订单
   *
   * API权限：api:order:approve
   * 按钮权限：button:order:approve, button:order:reject
   */
  @PutMapping('/:id/approve')
  @ApiPermission('order', 'approve', {
    description: '审核订单',
    group: '订单管理',
  })
  @ButtonPermission('order', 'approve', {
    description: '通过订单按钮',
    group: '订单管理',
    buttonId: 'btn-approve-order',
  })
  @ButtonPermission('order', 'reject', {
    description: '拒绝订单按钮',
    group: '订单管理',
    buttonId: 'btn-reject-order',
  })
  async approve(@PathVariable('id') id: number, @RequestBody() body: { approved: boolean; reason?: string }): Promise<any> {
    return this.orderService.approve(id, body);
  }
}

/**
 * 用户服务 - 演示方法权限控制
 */
@Service()
export class UserService {
  /**
   * 查找所有用户 - 使用方法权限装饰器
   *
   * 权限码：method:user:read
   */
  @MethodPermission('user', 'read', {
    description: '查询用户服务方法',
    group: '用户服务',
  })
  async findAll(): Promise<any[]> {
    // 实际的业务逻辑
    return [];
  }

  /**
   * 创建用户
   *
   * 权限码：method:user:create
   */
  @MethodPermission('user', 'create', {
    description: '创建用户服务方法',
    group: '用户服务',
  })
  async create(userData: any): Promise<any> {
    // 实际的业务逻辑
    return {};
  }

  /**
   * 更新用户
   *
   * 权限码：method:user:update
   */
  @MethodPermission('user', 'update', {
    description: '更新用户服务方法',
    group: '用户服务',
  })
  async update(id: number, userData: any): Promise<any> {
    // 实际的业务逻辑
    return {};
  }

  /**
   * 删除用户
   *
   * 权限码：method:user:delete
   */
  @MethodPermission('user', 'delete', {
    description: '删除用户服务方法',
    group: '用户服务',
  })
  async delete(id: number): Promise<boolean> {
    // 实际的业务逻辑
    return true;
  }

  /**
   * 重置密码
   *
   * 权限码：method:user:reset-password
   */
  @MethodPermission('user', 'reset-password', {
    description: '重置密码服务方法',
    group: '用户服务',
  })
  async resetPassword(id: number, newPassword: string): Promise<void> {
    // 实际的业务逻辑
  }
}

/**
 * 订单服务 - 演示方法权限控制
 */
@Service()
export class OrderService {
  /**
   * 查找所有订单
   *
   * 权限码：method:order:read
   */
  @MethodPermission('order', 'read', {
    description: '查询订单服务方法',
    group: '订单服务',
  })
  async findAll(): Promise<any[]> {
    // 实际的业务逻辑
    return [];
  }

  /**
   * 创建订单
   *
   * 权限码：method:order:create
   */
  @MethodPermission('order', 'create', {
    description: '创建订单服务方法',
    group: '订单服务',
  })
  async create(orderData: any): Promise<any> {
    // 实际的业务逻辑
    return {};
  }

  /**
   * 审核订单
   *
   * 权限码：method:order:approve
   */
  @MethodPermission('order', 'approve', {
    description: '审核订单服务方法',
    group: '订单服务',
  })
  async approve(id: number, approvalData: { approved: boolean; reason?: string }): Promise<any> {
    // 实际的业务逻辑
    return {};
  }
}

/**
 * 混合权限示例 - 展示如何混合使用不同的权限控制方式
 */
@RestController({ path: '/reports' })
export class ReportController {
  @Autowired()
  private reportService!: ReportService;

  /**
   * 生成报表 - 混合使用API权限和传统表达式
   *
   * API权限：api:report:generate
   * 传统表达式：hasRole('ADMIN')
   */
  @GetMapping('/generate')
  @ApiPermission('report', 'generate', {
    description: '生成报表',
    group: '报表管理',
  })
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  async generate(@RequestBody() params: any): Promise<any> {
    return this.reportService.generate(params);
  }

  /**
   * 导出报表 - 混合使用API权限和按钮权限
   *
   * API权限：api:report:export
   * 按钮权限：button:report:export
   */
  @PostMapping('/export')
  @ApiPermission('report', 'export', {
    description: '导出报表',
    group: '报表管理',
  })
  @ButtonPermission('report', 'export', {
    description: '导出报表按钮',
    group: '报表管理',
    buttonId: 'btn-export-report',
  })
  async export(@RequestBody() params: any): Promise<any> {
    return this.reportService.export(params);
  }
}

@Service()
export class ReportService {
  /**
   * 生成报表 - 方法权限
   *
   * 权限码：method:report:generate
   */
  @MethodPermission('report', 'generate', {
    description: '生成报表服务方法',
    group: '报表服务',
  })
  async generate(params: any): Promise<any> {
    // 实际的业务逻辑
    return {};
  }

  /**
   * 导出报表 - 方法权限
   *
   * 权限码：method:report:export
   */
  @MethodPermission('report', 'export', {
    description: '导出报表服务方法',
    group: '报表服务',
  })
  async export(params: any): Promise<any> {
    // 实际的业务逻辑
    return {};
  }
}

/**
 * 公开API示例 - 展示如何标记公开API
 */
@RestController({ path: '/public' })
export class PublicController {
  /**
   * 健康检查 - 公开API，不需要权限
   */
  @GetMapping('/health')
  @Public()
  async health(): Promise<{ status: string; timestamp: number }> {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  /**
   * 公开数据接口 - 使用API权限装饰器，但标记为非必需
   *
   * 这允许有权限的用户看到更多信息，没有权限的用户看到基础信息
   */
  @GetMapping('/data')
  @ApiPermission('public', 'data', {
    description: '公开数据接口',
    group: '公开接口',
    required: false, // 非必需权限
  })
  async getData(): Promise<any> {
    return { data: 'public data' };
  }
}