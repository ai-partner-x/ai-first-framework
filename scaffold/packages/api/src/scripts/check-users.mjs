#!/usr/bin/env node

/**
 * 检查数据库中的用户信息
 */

import { SqliteDialect } from 'kysely';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

// 创建Kysely实例
const { createPool } = await import('kysely');
const db = createPool({
  dialect: new SqliteDialect(),
  database: dbPath,
});

try {
  // 查询admin用户
  const adminUsers = await db.selectFrom('sys_user').where('user_name', '=', 'admin').selectAll();
  console.log('Admin users found:', JSON.stringify(adminUsers, null, 2));

  // 查询所有用户
  const allUsers = await db.selectFrom('sys_user').selectAll();
  console.log('Total users in database:', JSON.stringify(allUsers, null, 2));

  // 查询admin用户密码哈希
  if (adminUsers.length > 0) {
    const adminUser = adminUsers[0];
    console.log('Admin password hash:', adminUser.password_hash);
    console.log('Admin status:', adminUser.status);
  }

  await db.destroy();
  console.log('\n✅ Database query completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Database query error:', error);
  await db.destroy();
  process.exit(1);
}
