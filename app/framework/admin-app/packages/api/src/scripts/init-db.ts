/**
 * 初始化数据库表结构和默认数据
 * 运行: pnpm init-db
 */
import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createKyselyDatabase, getKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

await createKyselyDatabase({
  type: 'sqlite',
  filename: join(__dirname, '../../data/app.db'),
});

const db = getKyselyDatabase();

// 建表
await db.schema.createTable('sys_user').ifNotExists()
  .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  .addColumn('username', 'varchar(50)', col => col.notNull().unique())
  .addColumn('password', 'varchar(255)', col => col.notNull())
  .addColumn('real_name', 'varchar(50)')
  .addColumn('email', 'varchar(100)')
  .addColumn('phone', 'varchar(20)')
  .addColumn('status', 'integer', col => col.notNull().defaultTo(1))
  .addColumn('created_at', 'datetime')
  .addColumn('updated_at', 'datetime')
  .execute();

await db.schema.createTable('sys_role').ifNotExists()
  .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  .addColumn('role_code', 'varchar(50)', col => col.notNull().unique())
  .addColumn('role_name', 'varchar(50)', col => col.notNull())
  .addColumn('description', 'varchar(255)')
  .addColumn('status', 'integer', col => col.notNull().defaultTo(1))
  .addColumn('created_at', 'datetime')
  .execute();

await db.schema.createTable('sys_menu').ifNotExists()
  .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  .addColumn('parent_id', 'integer', col => col.notNull().defaultTo(0))
  .addColumn('menu_name', 'varchar(50)', col => col.notNull())
  .addColumn('menu_type', 'integer', col => col.notNull())
  .addColumn('path', 'varchar(255)')
  .addColumn('component', 'varchar(255)')
  .addColumn('permission', 'varchar(100)')
  .addColumn('icon', 'varchar(100)')
  .addColumn('sort_order', 'integer', col => col.notNull().defaultTo(0))
  .addColumn('status', 'integer', col => col.notNull().defaultTo(1))
  .execute();

await db.schema.createTable('sys_user_role').ifNotExists()
  .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  .addColumn('user_id', 'integer', col => col.notNull())
  .addColumn('role_id', 'integer', col => col.notNull())
  .execute();

await db.schema.createTable('sys_role_menu').ifNotExists()
  .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  .addColumn('role_id', 'integer', col => col.notNull())
  .addColumn('menu_id', 'integer', col => col.notNull())
  .execute();

console.log('✅ 表结构创建完成');

// 初始化超级管理员角色
const roles = await db.selectFrom('sys_role').where('role_code', '=', 'SUPER_ADMIN').selectAll().execute();
let adminRoleId: number;
if (!roles.length) {
  const result = await db.insertInto('sys_role')
    .values({ role_code: 'SUPER_ADMIN', role_name: '超级管理员', description: '拥有全部权限', status: 1, created_at: new Date().toISOString() })
    .executeTakeFirst();
  adminRoleId = Number(result.insertId);
  console.log('✅ 超级管理员角色创建完成');
} else {
  adminRoleId = roles[0].id as number;
}

// 初始化默认菜单
const menuCount = await db.selectFrom('sys_menu').select(db.fn.count('id').as('cnt')).executeTakeFirst();
if (Number(menuCount?.cnt) === 0) {
  // 系统管理目录
  const sysDir = await db.insertInto('sys_menu')
    .values({ parent_id: 0, menu_name: '系统管理', menu_type: 1, icon: 'Settings', sort_order: 100, status: 1 })
    .executeTakeFirst();
  const sysDirId = Number(sysDir.insertId);

  const menus = [
    { parent_id: sysDirId, menu_name: '用户管理', menu_type: 2, path: '/sys/user', permission: 'sys:user:list', sort_order: 1, status: 1 },
    { parent_id: sysDirId, menu_name: '角色管理', menu_type: 2, path: '/sys/role', permission: 'sys:role:list', sort_order: 2, status: 1 },
    { parent_id: sysDirId, menu_name: '菜单管理', menu_type: 2, path: '/sys/menu', permission: 'sys:menu:list', sort_order: 3, status: 1 },
  ];
  const insertedMenus = await db.insertInto('sys_menu').values(menus).executeTakeFirst();
  console.log('✅ 默认菜单创建完成');

  // 给超级管理员角色分配所有菜单
  const allMenus = await db.selectFrom('sys_menu').select('id').execute();
  for (const m of allMenus) {
    await db.insertInto('sys_role_menu').values({ role_id: adminRoleId, menu_id: m.id as number }).execute();
  }
}

// 初始化 admin 账号
const users = await db.selectFrom('sys_user').where('username', '=', 'admin').selectAll().execute();
if (!users.length) {
  const hashed = await bcrypt.hash('Admin@123', 10);
  const result = await db.insertInto('sys_user')
    .values({ username: 'admin', password: hashed, real_name: '超级管理员', status: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .executeTakeFirst();
  const adminUserId = Number(result.insertId);
  await db.insertInto('sys_user_role').values({ user_id: adminUserId, role_id: adminRoleId }).execute();
  console.log('✅ admin 账号创建完成 (密码: Admin@123)');
} else {
  console.log('ℹ️  admin 账号已存在，跳过');
}

console.log('\n🎉 数据库初始化完成！');
process.exit(0);
