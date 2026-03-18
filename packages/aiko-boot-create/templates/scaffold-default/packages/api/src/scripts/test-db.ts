import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');

import { createKyselyDatabase, getKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';

async function test() {
    console.log('Testing database connection...');

    await createKyselyDatabase({
        type: 'sqlite',
        filename: dbPath,
    });

    const db = getKyselyDatabase();

    const user = await db.selectFrom('sys_user').where('user_name', '=', 'admin').selectAll().executeTakeFirst();

    if (user) {
        console.log('User found:', user.user_name);
        console.log('Password hash:', user.password_hash?.substring(0, 20) + '...');

        const isValid = await bcrypt.compare('admin123', user.password_hash || '');
        console.log('Password valid:', isValid);
    } else {
        console.log('User not found');
    }

    process.exit(0);
}

test().catch(console.error);
