/**
 * 装饰器使用示例
 * 展示 @Slf4j 和 @Log 装饰器的用法
 */

import { Slf4j } from '../src/decorators/slf4j.decorator';
import { Log, LogInfo, LogDebug, LogError } from '../src/decorators/log.decorator';

// 示例 1: 基本使用
@Slf4j()
class UserService {
  
  @Log()
  async getUser(id: string) {
    this.logger.info(`Getting user ${id}`);
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, name: 'John Doe' };
  }
  
  @Log({ level: 'debug', message: 'Creating user' })
  createUser(data: any) {
    // 自动记录方法调用
    return { id: '123', ...data };
  }
  
  @LogError('Failed to delete user')
  deleteUser(id: string) {
    if (!id) {
      throw new Error('Invalid user ID');
    }
    // 业务逻辑
    return true;
  }
  
  @LogInfo('Updating user profile')
  updateUser(id: string, profile: any) {
    this.logger.info(`Updating profile for user ${id}`);
    return { id, ...profile };
  }
}

// 示例 2: 自定义配置
@Slf4j({ 
  name: 'OrderService',
  level: 'debug',
  factoryOptions: { level: 'debug' }
})
class OrderService {
  
  @Log({
    level: 'info',
    message: 'Processing order',
    logArgs: true,
    logResult: true,
    logDuration: true
  })
  processOrder(orderId: string, items: any[]) {
    this.logger.debug(`Processing order ${orderId} with ${items.length} items`);
    return { orderId, status: 'processed', total: items.length * 10 };
  }
  
  @Log({
    level: 'warn',
    message: 'Cancelling order',
    logError: true
  })
  cancelOrder(orderId: string) {
    if (Math.random() > 0.5) {
      throw new Error('Order cannot be cancelled');
    }
    return { orderId, status: 'cancelled' };
  }
}

// 示例 3: 混合使用（传统方式 + 装饰器）
import { getLogger } from '../src/core/facade';

class MixedService {
  // 传统方式
  private traditionalLogger = getLogger('MixedService:Traditional');
  
  // 装饰器方式
  @LogDebug('Debug method called')
  debugMethod() {
    this.traditionalLogger.info('Using traditional logger');
    return 'mixed';
  }
}

// 示例 4: 使用便捷装饰器
@Slf4j({ name: 'ProductService' })
class ProductService {
  
  @LogInfo()
  getProduct(id: string) {
    return { id, name: 'Product ' + id };
  }
  
  @LogDebug()
  searchProducts(query: string) {
    this.logger.debug(`Searching for: ${query}`);
    return [{ id: '1', name: query }];
  }
  
  @LogError('Product creation failed')
  createProduct(data: any) {
    if (!data.name) {
      throw new Error('Product name is required');
    }
    return { id: 'new', ...data };
  }
}

// 运行示例
async function runExamples() {
  console.log('=== 装饰器使用示例 ===\n');
  
  // 示例 1
  const userService = new UserService();
  console.log('1. UserService 示例:');
  try {
    const user = await userService.getUser('123');
    console.log('   getUser 结果:', user);
    
    const created = userService.createUser({ name: 'Alice' });
    console.log('   createUser 结果:', created);
    
    userService.deleteUser(''); // 会抛出错误
  } catch (error) {
    console.log('   deleteUser 错误:', error.message);
  }
  
  // 示例 2
  const orderService = new OrderService();
  console.log('\n2. OrderService 示例:');
  try {
    const order = orderService.processOrder('ORD-001', [{ id: 1 }, { id: 2 }]);
    console.log('   processOrder 结果:', order);
    
    orderService.cancelOrder('ORD-002');
  } catch (error) {
    console.log('   cancelOrder 错误:', error.message);
  }
  
  // 示例 3
  const mixedService = new MixedService();
  console.log('\n3. MixedService 示例:');
  const mixedResult = mixedService.debugMethod();
  console.log('   debugMethod 结果:', mixedResult);
  
  // 示例 4
  const productService = new ProductService();
  console.log('\n4. ProductService 示例:');
  try {
    const product = productService.getProduct('P001');
    console.log('   getProduct 结果:', product);
    
    const search = productService.searchProducts('laptop');
    console.log('   searchProducts 结果:', search);
    
    productService.createProduct({}); // 会抛出错误
  } catch (error) {
    console.log('   createProduct 错误:', error.message);
  }
  
  console.log('\n=== 示例完成 ===');
}

// 执行示例
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  UserService,
  OrderService,
  MixedService,
  ProductService,
  runExamples
};