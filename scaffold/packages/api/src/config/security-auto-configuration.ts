import 'reflect-metadata';
import {
  AutoConfiguration,
  OnApplicationReady,
  ConfigLoader,
  getApplicationContext,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';
import { getExpressApp } from '@ai-partner-x/aiko-boot-starter-web';
import { AuthInterceptor } from '@ai-partner-x/aiko-boot-starter-security';
import { PermissionInterceptor } from '@ai-partner-x/aiko-boot-starter-security';
import { getLogger } from '@ai-partner-x/aiko-boot-starter-log';

/**
 * 自定义安全自动配置
 * 在路由注册之前添加安全中间件
 */
@AutoConfiguration({ order: 150 }) // 在WebAutoConfiguration之前执行（order: 200）
@Component()
export class SecurityAutoConfiguration {
  private logger = getLogger('security-auto-configuration');

  @OnApplicationReady({ order: 30 }) // 在WebAutoConfiguration之前（order: 50）
  async configureSecurityMiddleware(): Promise<void> {
    const context = getApplicationContext();
    if (!context) {
      this.logger.warn('ApplicationContext not available');
      return;
    }

    // 检查安全组件是否启用
    const securityEnabled = ConfigLoader.get<boolean>('security.enabled', true);
    if (!securityEnabled) {
      this.logger.warn('Security is disabled - this is not recommended for production');
      return;
    }

    const expressApp = getExpressApp();
    if (!expressApp) {
      this.logger.warn('Express app not available');
      return;
    }

    // 获取AuthInterceptor和PermissionInterceptor
    const authInterceptor = context.getBean(AuthInterceptor);
    const permissionInterceptor = context.getBean(PermissionInterceptor);

    if (!authInterceptor || !permissionInterceptor) {
      this.logger.warn('Security interceptors not available');
      return;
    }

    // 添加AuthInterceptor中间件
    expressApp.use(async (req: any, res: any, next: any) => {
      try {
        await authInterceptor.intercept(req, res, next);
      } catch (error) {
        this.logger.error('Auth interceptor error', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // 添加PermissionInterceptor中间件
    expressApp.use(async (req: any, res: any, next: any) => {
      try {
        await permissionInterceptor.intercept(req, res, next);
      } catch (error) {
        this.logger.error('Permission interceptor error', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    this.logger.info('Security middleware configured successfully');
  }
}
