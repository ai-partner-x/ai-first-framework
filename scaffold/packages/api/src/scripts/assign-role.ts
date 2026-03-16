import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createKyselyDatabase, getKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

await createKyselyDatabase({
    type: 'sqlite',
    filename: dbPath,
});

const db = getKyselyDatabase();

const users = await db.selectFrom('sys_user').selectAll().execute();
const roles = await db.selectFrom('sys_role').selectAll().execute();

if (users.length > 0 && roles.length > 0) {
    const adminUser = users.find(u => u.user_name === 'admin');
    const adminRole = roles.find(r => r.role_code === 'SUPER_ADMIN');
    
    if (adminUser && adminRole) {
        const existing = await db.selectFrom('sys_user_role')
            .where('user_id', '=', adminUser.id as number)
            .where('role_id', '=', adminRole.id as number)
            .selectAll()
            .execute();
        
        if (existing.length === 0) {
            await db.insertInto('sys_user_role')
                .values({ user_id: adminUser.id as number, role_id: adminRole.id as number })
                .execute();
            console.log('✅ 已为 admin 用户分配 SUPER_ADMIN 角色');
        } else {
            console.log('ℹ️  admin 用户已有 SUPER_ADMIN 角色');
        }
    }
}

process.exit(0);
