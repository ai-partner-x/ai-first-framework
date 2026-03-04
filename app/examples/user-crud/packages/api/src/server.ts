/**
 * API Server - Spring Boot 风格自动配置
 */
import { createApp } from '@ai-first/nextjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;

const app = await createApp({
  srcDir: __dirname,
  database: {
    type: 'sqlite',
    filename: join(__dirname, '../data/app.db'), // 本地 SQLite 文件
  },
});

app.listen(PORT, () => {
  console.log('\n🚀 API Server running at http://localhost:' + PORT);
  console.log('📚 API: http://localhost:' + PORT + '/api/users\n');
});
