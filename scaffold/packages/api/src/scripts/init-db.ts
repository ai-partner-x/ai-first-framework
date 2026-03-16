/**
 * 初始化数据库表结构和默认数据
 * 运行: pnpm init-db
 */
import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { createKyselyDatabase, getKyselyDatabase } from '@ai-partner-x/aiko-boot-starter-orm';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/app.db');
const dir = dirname(dbPath);
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
}

await createKyselyDatabase({
    type: 'sqlite',
    filename: join(__dirname, '../../data/app.db'),
});

const db = getKyselyDatabase();

// 建表
await db.schema.createTable('sys_user').ifNotExists()
    .addColumn('id', 'integer', (col: any) => col.primaryKey().autoIncrement())
    .addColumn('user_name', 'varchar(50)', (col: any) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col: any) => col.notNull())
    .addColumn('real_name', 'varchar(50)')
    .addColumn('email', 'varchar(100)')
    .addColumn('phone', 'varchar(20)')
    .addColumn('status', 'integer', (col: any) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'datetime')
    .addColumn('updated_at', 'datetime')
    .execute();

await db.schema.createTable('sys_role').ifNotExists()
    .addColumn('id', 'integer', (col: any) => col.primaryKey().autoIncrement())
    .addColumn('role_code', 'varchar(50)', (col: any) => col.notNull().unique())
    .addColumn('role_name', 'varchar(50)', (col: any) => col.notNull())
    .addColumn('description', 'varchar(255)')
    .addColumn('status', 'integer', (col: any) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'datetime')
    .execute();

await db.schema.createTable('sys_menu').ifNotExists()
    .addColumn('id', 'integer', (col: any) => col.primaryKey().autoIncrement())
    .addColumn('parent_id', 'integer', (col: any) => col.notNull().defaultTo(0))
    .addColumn('menu_name', 'varchar(50)', (col: any) => col.notNull())
    .addColumn('menu_type', 'integer', (col: any) => col.notNull())
    .addColumn('path', 'varchar(255)')
    .addColumn('component', 'varchar(255)')
    .addColumn('permission', 'varchar(100)')
    .addColumn('icon', 'varchar(100)')
    .addColumn('sort_order', 'integer', (col: any) => col.notNull().defaultTo(0))
    .addColumn('status', 'integer', (col: any) => col.notNull().defaultTo(1))
    .execute();

await db.schema.createTable('sys_user_role').ifNotExists()
    .addColumn('id', 'integer', (col: any) => col.primaryKey().autoIncrement())
    .addColumn('user_id', 'integer', (col: any) => col.notNull())
    .addColumn('role_id', 'integer', (col: any) => col.notNull())
    .execute();

await db.schema.createTable('sys_role_menu').ifNotExists()
    .addColumn('id', 'integer', (col: any) => col.primaryKey().autoIncrement())
    .addColumn('role_id', 'integer', (col: any) => col.notNull())
    .addColumn('menu_id', 'integer', (col: any) => col.notNull())
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
const cntValue = menuCount && menuCount.cnt;
if (Number(cntValue) === 0) {
    // 系统管理目录
    const sysDir = await db.insertInto('sys_menu')
        .values({ parent_id: 0, menu_name: '系统管理', menu_type: 1, icon: 'Settings', sort_order: 100, status: 1 })
        .executeTakeFirst();
    const sysDirId = Number(sysDir.insertId);

    // 用户管理菜单及其按钮权限
    const userMenu = await db.insertInto('sys_menu')
        .values({ parent_id: sysDirId, menu_name: '用户管理', menu_type: 2, path: '/sys/user', permission: 'sys:user:list', icon: 'User', sort_order: 1, status: 1 })
        .executeTakeFirst();
    const userMenuId = Number(userMenu.insertId);
    
    const userButtons = [
        { parent_id: userMenuId, menu_name: '查询用户', menu_type: 3, permission: 'sys:user:query', sort_order: 1, status: 1 },
        { parent_id: userMenuId, menu_name: '新增用户', menu_type: 3, permission: 'sys:user:add', sort_order: 2, status: 1 },
        { parent_id: userMenuId, menu_name: '编辑用户', menu_type: 3, permission: 'sys:user:edit', sort_order: 3, status: 1 },
        { parent_id: userMenuId, menu_name: '删除用户', menu_type: 3, permission: 'sys:user:delete', sort_order: 4, status: 1 },
        { parent_id: userMenuId, menu_name: '重置密码', menu_type: 3, permission: 'sys:user:resetPwd', sort_order: 5, status: 1 },
    ];
    await db.insertInto('sys_menu').values(userButtons).execute();

    // 角色管理菜单及其按钮权限
    const roleMenu = await db.insertInto('sys_menu')
        .values({ parent_id: sysDirId, menu_name: '角色管理', menu_type: 2, path: '/sys/role', permission: 'sys:role:list', icon: 'Role', sort_order: 2, status: 1 })
        .executeTakeFirst();
    const roleMenuId = Number(roleMenu.insertId);
    
    const roleButtons = [
        { parent_id: roleMenuId, menu_name: '查询角色', menu_type: 3, permission: 'sys:role:query', sort_order: 1, status: 1 },
        { parent_id: roleMenuId, menu_name: '新增角色', menu_type: 3, permission: 'sys:role:add', sort_order: 2, status: 1 },
        { parent_id: roleMenuId, menu_name: '编辑角色', menu_type: 3, permission: 'sys:role:edit', sort_order: 3, status: 1 },
        { parent_id: roleMenuId, menu_name: '删除角色', menu_type: 3, permission: 'sys:role:delete', sort_order: 4, status: 1 },
    ];
    await db.insertInto('sys_menu').values(roleButtons).execute();

    // 菜单管理菜单及其按钮权限
    const menuMenu = await db.insertInto('sys_menu')
        .values({ parent_id: sysDirId, menu_name: '菜单管理', menu_type: 2, path: '/sys/menu', permission: 'sys:menu:list', icon: 'Menu', sort_order: 3, status: 1 })
        .executeTakeFirst();
    const menuMenuId = Number(menuMenu.insertId);
    
    const menuButtons = [
        { parent_id: menuMenuId, menu_name: '查询菜单', menu_type: 3, permission: 'sys:menu:query', sort_order: 1, status: 1 },
        { parent_id: menuMenuId, menu_name: '新增菜单', menu_type: 3, permission: 'sys:menu:add', sort_order: 2, status: 1 },
        { parent_id: menuMenuId, menu_name: '编辑菜单', menu_type: 3, permission: 'sys:menu:edit', sort_order: 3, status: 1 },
        { parent_id: menuMenuId, menu_name: '删除菜单', menu_type: 3, permission: 'sys:menu:delete', sort_order: 4, status: 1 },
    ];
    await db.insertInto('sys_menu').values(menuButtons).execute();

    console.log('✅ 默认菜单和权限创建完成');

    // 给超级管理员角色分配所有菜单
    const allMenus = await db.selectFrom('sys_menu').select('id').execute();
    for (const m of allMenus) {
        await db.insertInto('sys_role_menu').values({ role_id: adminRoleId, menu_id: m.id as number }).execute();
    }
    console.log('✅ 超级管理员角色权限分配完成');
}

// 初始化 admin 账号
const users = await db.selectFrom('sys_user').where('user_name', '=', 'admin').selectAll().execute();
if (!users.length) {
    const hashed = '$2a$10$jYriD6EK14jUM7W6H5zcleTpVbJVPORxjNXOJsnE0F7ImT0BskCW2';
    const result = await db.insertInto('sys_user')
        .values({ user_name: 'admin', password_hash: hashed, email: 'admin@example.com', real_name: '超级管理员', status: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .executeTakeFirst();
    const adminUserId = Number(result.insertId);
    await db.insertInto('sys_user_role').values({ user_id: adminUserId, role_id: adminRoleId }).execute();
    console.log('✅ admin 账号创建完成 (密码: Admin@123)');
} else {
    console.log('ℹ️  admin 账号已存在，跳过');
}

console.log('\n🎉 数据库初始化完成！');
process.exit(0);
