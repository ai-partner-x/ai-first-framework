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
console.log('用户:');
console.log(JSON.stringify(users, null, 2));

const roles = await db.selectFrom('sys_role').selectAll().execute();
console.log('\n角色:');
console.log(JSON.stringify(roles, null, 2));

const userRoles = await db.selectFrom('sys_user_role').selectAll().execute();
console.log('\n用户角色关联:');
console.log(JSON.stringify(userRoles, null, 2));

process.exit(0);
