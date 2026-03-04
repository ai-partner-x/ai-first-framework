/**
 * 初始化 SQLite 数据库表结构
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

// 创建 sys_user 表（对应 @Entity({ tableName: 'sys_user' })）
db.exec(`
  CREATE TABLE IF NOT EXISTS sys_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    age INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Created table: sys_user');

// 插入测试数据
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO sys_user (user_name, email, age)
  VALUES (@user_name, @email, @age)
`);

const testUsers = [
  { user_name: 'admin', email: 'admin@test.com', age: 30 },
  { user_name: 'user1', email: 'user1@test.com', age: 25 },
  { user_name: 'user2', email: 'user2@test.com', age: 28 },
];

for (const user of testUsers) {
  try {
    insertUser.run(user);
    console.log(`✅ Inserted user: ${user.user_name}`);
  } catch {
    console.log(`⏭️  User exists: ${user.user_name}`);
  }
}

db.close();
console.log('\n🎉 Database initialization complete!');
