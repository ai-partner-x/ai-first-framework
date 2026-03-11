/**
 * 初始化 SQLite 数据库表结构
 *
 * 运行：pnpm init-db
 *
 * 对应 Java Spring Boot: schema.sql + data.sql
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/cache_example.db');

// 确保 data 目录存在
mkdirSync(join(__dirname, '../../data'), { recursive: true });

console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

// 创建 cache_user 表（对应 @Entity({ tableName: 'cache_user' })）
db.exec(`
  CREATE TABLE IF NOT EXISTS cache_user (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    email TEXT    NOT NULL UNIQUE,
    age   INTEGER
  )
`);

console.log('✅ Created table: cache_user');

// 插入种子数据
const insert = db.prepare(`
  INSERT OR IGNORE INTO cache_user (name, email, age)
  VALUES (@name, @email, @age)
`);

const seed = [
  { name: '张三', email: 'zhangsan@example.com', age: 25 },
  { name: '李四', email: 'lisi@example.com',     age: 30 },
  { name: '王五', email: 'wangwu@example.com',   age: 22 },
];

for (const row of seed) {
  try {
    insert.run(row);
    console.log(`  ✅ Inserted: ${row.name}`);
  } catch {
    console.log(`  ⏭️  Skipped (already exists): ${row.name}`);
  }
}

db.close();
console.log('\n🎉 Database initialization complete!');
