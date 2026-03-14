/**
 * Database Factory - 数据库连接工厂
 * 
 * 支持 PostgreSQL、SQLite、MySQL 等多种数据库
 */

import { Kysely, PostgresDialect, SqliteDialect, MysqlDialect, type MysqlPool } from 'kysely';

export type DatabaseType = 'postgres' | 'sqlite' | 'mysql';

export interface PostgresConnectionConfig {
  type: 'postgres';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface SqliteConnectionConfig {
  type: 'sqlite';
  /** 数据库文件路径，使用 ':memory:' 表示内存数据库 */
  filename: string;
}

export interface MysqlConnectionConfig {
  type: 'mysql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export type DatabaseConnectionConfig = 
  | PostgresConnectionConfig 
  | SqliteConnectionConfig 
  | MysqlConnectionConfig;

/** 全局 Kysely 实例 */
let globalKyselyInstance: Kysely<any> | null = null;
let globalDatabaseConfig: DatabaseConnectionConfig | null = null;

/**
 * 创建 Kysely 数据库实例
 */
export async function createKyselyDatabase(config: DatabaseConnectionConfig): Promise<Kysely<any>> {
  globalDatabaseConfig = config;
  
  switch (config.type) {
    case 'postgres': {
      const pg = await import('pg');
      const pool = new pg.default.Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });
      globalKyselyInstance = new Kysely({
        dialect: new PostgresDialect({ pool }),
      });
      break;
    }
    
    case 'sqlite': {
      const BetterSqlite3 = await import('better-sqlite3');
      const db = new BetterSqlite3.default(config.filename);
      globalKyselyInstance = new Kysely({
        dialect: new SqliteDialect({ database: db }),
      });
      break;
    }
    
    case 'mysql': {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - mysql2 is an optional peer dependency
      const mysql = await import('mysql2');
      const pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });
      // mysql2 的 Pool 与 Kysely 的 MysqlPool 接口在类型上不完全一致，但运行时兼容，故做类型断言
      globalKyselyInstance = new Kysely({
        dialect: new MysqlDialect({ pool: pool as MysqlPool }),
      });
      break;
    }
    
    default:
      throw new Error(`Unsupported database type: ${(config as any).type}`);
  }
  
  return globalKyselyInstance;
}

/**
 * 获取全局 Kysely 实例
 */
export function getKyselyDatabase(): Kysely<any> {
  if (!globalKyselyInstance) {
    throw new Error('Database not initialized. Call createKyselyDatabase() first.');
  }
  return globalKyselyInstance;
}

/**
 * 获取数据库配置
 */
export function getKyselyDatabaseConfig(): DatabaseConnectionConfig {
  if (!globalDatabaseConfig) {
    throw new Error('Database not configured. Call createKyselyDatabase() first.');
  }
  return globalDatabaseConfig;
}

/**
 * 关闭数据库连接
 */
export async function closeKyselyDatabase(): Promise<void> {
  if (globalKyselyInstance) {
    await globalKyselyInstance.destroy();
    globalKyselyInstance = null;
    globalDatabaseConfig = null;
  }
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  return globalKyselyInstance !== null;
}
