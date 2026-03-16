#!/usr/bin/env node

/**
 * 重置admin密码为admin123
 */

import bcrypt from 'bcryptjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetting admin password process...');

    // 删除旧的admin账号
    const dbPath = 'data/app.db';
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found: ' + dbPath);
    }
    console.log('📁 Database file found:', dbPath);

    // 生成admin123的密码哈希
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Generated hash for admin123:', hashedPassword.substring(0, 20) + '...');

    // 修改init-db.ts，使用新的密码哈希
    const initDbPath = './src/scripts/init-db.ts';
    let initDbContent = fs.readFileSync(initDbPath, 'utf-8');

    // 替换密码哈希
    initDbContent = initDbContent.replace(
      /await bcrypt\.hash\('admin123', 10\)/g,
      `'${hashedPassword}'`
    );

    // 写回文件
    fs.writeFileSync(initDbPath, initDbContent, 'utf-8');
    console.log('📝 Updated init-db.ts with new password hash');

    // 重新初始化数据库
    console.log('🔄 Re-initializing database with new password...');
    const { execSync } = await import('child_process');

    const result = execSync('node --import @swc-node/register/esm-register src/scripts/init-db.ts', {
      cwd: process.cwd(),
      stdio: 'inherit',
      timeout: 30000
    });

    if (result.status === 0) {
      console.log('✅ Database re-initialization completed!');
      console.log('');
      console.log('🎉 Admin password has been reset to: admin123!');
      console.log('🎉 You can now login with: admin / admin123');
      console.log('');
      console.log('🔐 Please restart the server for changes to take effect.');
    } else {
      console.error('❌ Database initialization failed with code:', result.status);
      console.error('Error output:', result.stderr);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
