/**
 * aiko-boot-starter-log 自动配置示例
 * 
 * 演示如何使用基于 Spring Boot 风格的自动配置
 * 通过 app-config.json 配置文件控制日志行为
 */

import 'reflect-metadata';
import { createApp } from '@ai-partner-x/aiko-boot/boot';
import { LogAutoConfiguration, logAutoConfigure, getLogger } from '../src';

/**
 * 示例应用类
 * 演示如何集成日志自动配置
 */
class ExampleApp {
  private readonly logger = getLogger('ExampleApp');

  async run() {
    this.logger.info('应用启动中...');
    
    // 演示不同级别的日志
    this.logger.debug('调试信息');
    this.logger.info('普通信息');
    this.logger.warn('警告信息');
    this.logger.error('错误信息');
    
    // 演示带元数据的日志
    this.logger.info('用户登录', { userId: 123, username: 'john.doe' });
    
    this.logger.info('应用运行完成');
  }
}

/**
 * 应用配置示例
 * 在 app-config.json 中配置:
 * 
 * {
 *   "logging": {
 *     "level": "debug",
 *     "format": "text",
 *     "colorize": true,
 *     "timestamp": true,
 *     "consoleEnabled": true,
 *     "fileEnabled": true,
 *     "filePath": "./logs/example.log",
 *     "fileMaxSize": "10m",
 *     "fileMaxFiles": 5
 *   }
 * }
 */

/**
 * 启动应用
 */
async function bootstrap() {
  try {
    console.log('🚀 启动示例应用...');
    
    // 创建应用实例
    const app = createApp({
      // 启用自动配置
      enableAutoConfiguration: true,
      // 配置扫描路径
      scanPackages: ['@ai-partner-x/aiko-boot-starter-log'],
    });
    
    // 注册日志自动配置
    app.configure(logAutoConfigure);
    
    // 或者直接注册配置类
    // app.registerAutoConfiguration(LogAutoConfiguration);
    
    // 启动应用
    await app.start();
    
    console.log('✅ 应用启动成功');
    
    // 运行示例
    const example = new ExampleApp();
    await example.run();
    
    // 优雅关闭
    await app.shutdown();
    console.log('👋 应用已关闭');
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
  }
}

// 直接运行示例
if (require.main === module) {
  bootstrap();
}

export { ExampleApp, bootstrap };