import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createKyselyDatabase, getKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

await createKyselyDatabase({
    type: 'sqlite',
    filename: dbPath,
});

const db = getKyselyDatabase();

const users = await db.selectFrom('sys_user').selectAll().execute();
console.log('现有用户:');
for (const u of users) {
    console.log(`  - ${u.user_name} (status: ${u.status})`);
}

const hashed = await bcrypt.hash('admin123', 10);
await db.updateTable('sys_user')
    .set({ password_hash: hashed, updated_at: new Date().toISOString() })
    .where('user_name', '=', 'admin')
    .execute();

console.log('\n✅ admin 密码已重置为: admin123');

process.exit(0);
