/**
 * ORM Auto Configuration - Spring Boot 风格自动配置
 * 
 * 根据配置文件自动初始化数据库连接
 * 
 * @example
 * ```json
 * // app.config.json
 * {
 *   "database": {
 *     "type": "sqlite",
 *     "filename": "./data/app.db"
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import {
  AutoConfiguration,
  ConfigurationProperties,
  ConditionalOnProperty,
  OnApplicationReady,
  OnApplicationShutdown,
  ConfigLoader,
  getApplicationContext,
} from '@ai-partner-x/aiko-boot/boot';
import { Component } from '@ai-partner-x/aiko-boot';
import { createKyselyDatabase, closeKyselyDatabase, type DatabaseConnectionConfig } from './database.js';
import { getMapperMetadata } from './decorators.js';
import { createAdapterFromEntity } from './config.js';
import { Container } from '@ai-partner-x/aiko-boot/di/server';

/**
 * 数据库配置属性类
 * 
 * 对应配置文件中的 database.* 配置
 */
@ConfigurationProperties('database')
export class DatabaseProperties {
  /** 数据库类型: postgres | sqlite | mysql */
  type?: 'postgres' | 'sqlite' | 'mysql';
  
  // SQLite
  /** SQLite 数据库文件路径 */
  filename?: string;
  
  // PostgreSQL / MySQL
  /** 数据库主机 */
  host?: string;
  /** 数据库端口 */
  port?: number;
  /** 数据库用户名 */
  user?: string;
  /** 数据库密码 */
  password?: string;
  /** 数据库名称 */
  database?: string;
}

/**
 * ORM 自动配置类
 * 
 * 当配置了 database.type 时自动初始化数据库连接
 */
@AutoConfiguration({ order: 10 })
@ConditionalOnProperty('database.type')
@Component()
export class OrmAutoConfiguration {
  private kyselyInstance: any = null;

  /**
   * 应用启动时初始化数据库连接
   */
  @OnApplicationReady({ order: -100 })
  async initializeDatabase(): Promise<void> {
    const config = this.buildDatabaseConfig();
    if (!config) {
      console.warn('[aiko-orm] Database configuration incomplete, skipping initialization');
      return;
    }

    console.log(`🗄️  [aiko-orm] Initializing ${config.type} database...`);
    this.kyselyInstance = await createKyselyDatabase(config);
    console.log(`✅ [aiko-orm] Database connected`);

    // 数据库初始化后，为所有注册的Mapper设置适配器
    this.configureMappers();
  }

  /**
   * 为所有注册的Mapper设置数据库适配器
   */
  private configureMappers(): void {
    try {
      const context = getApplicationContext();
      if (!context) {
        console.warn('[aiko-orm] ApplicationContext not available, skipping Mapper adapter configuration');
        return;
      }

      // 获取所有Mapper类型的组件
      const mapperComponents = context.components.get('mapper') || [];

      if (mapperComponents.length === 0) {
        console.log('[aiko-orm] No Mappers found');
        return;
      }

      console.log(`[aiko-orm] Configuring ${mapperComponents.length} Mapper(s)...`);

      for (const MapperConstructor of mapperComponents) {
        try {
          const mapperMetadata = getMapperMetadata(MapperConstructor);

          if (mapperMetadata && mapperMetadata.entity) {
            // 直接实例化Mapper并设置适配器
            const mapperInstance = new MapperConstructor();

            if (mapperInstance && typeof mapperInstance.setAdapter === 'function') {
              const adapter = createAdapterFromEntity(mapperMetadata.entity as any);
              mapperInstance.setAdapter(adapter);
              console.log(`[aiko-orm] Configured adapter for ${mapperMetadata.className}`);

              // 将配置好的Mapper实例注册到DI容器，以便@Service通过@Autowired获取
              Container.registerInstance(MapperConstructor as any, mapperInstance);
            }
          }
        } catch (error) {
          console.warn(`[aiko-orm] Failed to configure adapter for Mapper:`, error);
        }
      }
    } catch (error) {
      console.warn('[aiko-orm] Failed to configure Mappers:', error);
    }
  }

  /**
   * 应用关闭时断开数据库连接
   */
  @OnApplicationShutdown({ order: 100 })
  async closeDatabase(): Promise<void> {
    if (this.kyselyInstance) {
      console.log('🗄️  [aiko-orm] Closing database connection...');
      await closeKyselyDatabase();
      console.log('✅ [aiko-orm] Database disconnected');
    }
  }

  /**
   * 从配置构建数据库连接配置
   */
  private buildDatabaseConfig(): DatabaseConnectionConfig | null {
    const type = ConfigLoader.get<string>('database.type');
    
    if (!type) return null;

    switch (type) {
      case 'sqlite': {
        const filename = ConfigLoader.get<string>('database.filename');
        if (!filename) return null;
        return { type: 'sqlite', filename };
      }
      
      case 'postgres':
      case 'mysql': {
        const host = ConfigLoader.get<string>('database.host');
        const port = ConfigLoader.get<number>('database.port');
        const user = ConfigLoader.get<string>('database.user');
        const password = ConfigLoader.get<string>('database.password');
        const database = ConfigLoader.get<string>('database.database');
        
        if (!host || !port || !user || !database) return null;
        
        return {
          type,
          host,
          port,
          user,
          password: password || '',
          database,
        } as DatabaseConnectionConfig;
      }
      
      default:
        return null;
    }
  }
}
