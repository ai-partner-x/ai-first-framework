#!/usr/bin/env node

/**
 * 简单脚本：重新初始化数据库以设置admin123密码
 */

const { execSync } = await import('child_process');

async function simpleReset() {
  try {
    console.log('🔄 Re-initializing database with admin123 password...');
    console.log('⏰ This will take about 10-15 seconds...');

    const result = execSync('node --import @swc-node/register/esm-register src/scripts/init-db.ts', {
      cwd: process.cwd(),
      stdio: 'inherit',
      timeout: 30000
    });

    if (result.status === 0) {
      console.log('');
      console.log('🎉 Database initialization completed successfully!');
      console.log('🎉 Admin password has been set to: admin123');
      console.log('🎉 You can now login with: admin / admin123');
      console.log('');
      console.log('🔐 Please restart the server for changes to take effect.');
      console.log('');
    } else {
      console.error('❌ Database initialization failed with code:', result.status);
      console.error('Error output:', result.stderr);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  }
}

simpleReset();
