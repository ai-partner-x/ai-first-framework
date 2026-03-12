import { AikoBootApplication, Autowired } from '@ai-partner-x/aiko-boot';
import { SecurityModule } from '@ai-partner-x/aiko-boot-starter-security';
import { DatabaseModule } from '@ai-partner-x/aiko-boot-starter-orm';
import { ValidationModule } from '@ai-partner-x/aiko-boot-starter-validation';
import { WebModule } from '@ai-partner-x/aiko-boot-starter-web';
import appConfig from './app.config.js';
import { AuthController, UserController, RoleController, PermissionController } from './controller/index.js';
import { AuthService, UserService, RoleService, PermissionService, OAuthService } from './service/index.js';
import { AuthInterceptor, PermissionInterceptor } from './middleware/index.js';
import { User, Role, Permission, UserRole, RolePermission, OAuthAccount } from './entity/index.js';

@AikoBootApplication({
  imports: [
    SecurityModule.forRoot(appConfig.security),
    DatabaseModule.forRoot(appConfig.database),
    ValidationModule.forRoot(appConfig.validation),
    WebModule.forRoot(appConfig.server),
  ],
  controllers: [
    AuthController,
    UserController,
    RoleController,
    PermissionController,
  ],
  providers: [
    AuthService,
    UserService,
    RoleService,
    PermissionService,
    OAuthService,
    AuthInterceptor,
    PermissionInterceptor,
  ],
  entities: [
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    OAuthAccount,
  ],
})
export class Application {
  @Autowired()
  private databaseModule!: DatabaseModule;

  async onApplicationBootstrap(): Promise<void> {
    console.log('应用正在启动...');
    console.log(`服务器端口: ${appConfig.server.port}`);
    console.log(`上下文路径: ${appConfig.server.servlet.contextPath}`);
    console.log(`数据库类型: ${appConfig.database.type}`);
    console.log(`数据库文件: ${appConfig.database.filename}`);
    console.log('安全模块已启用');
    console.log('应用启动完成！');
  }

  async onApplicationShutdown(): Promise<void> {
    console.log('应用正在关闭...');
  }
}

const app = new Application();
app.run();
