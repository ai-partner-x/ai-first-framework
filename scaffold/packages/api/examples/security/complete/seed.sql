-- 插入基础权限
INSERT INTO permissions (name, description, resource, action) VALUES
('user:create', '创建用户', 'user', 'create'),
('user:update', '更新用户', 'user', 'update'),
('user:delete', '删除用户', 'user', 'delete'),
('user:view', '查看用户', 'user', 'view'),
('role:create', '创建角色', 'role', 'create'),
('role:update', '更新角色', 'role', 'update'),
('role:delete', '删除角色', 'role', 'delete'),
('role:view', '查看角色', 'role', 'view'),
('permission:create', '创建权限', 'permission', 'create'),
('permission:update', '更新权限', 'permission', 'update'),
('permission:delete', '删除权限', 'permission', 'delete'),
('permission:view', '查看权限', 'permission', 'view');

-- 插入基础角色
INSERT INTO roles (name, description) VALUES
('ADMIN', '管理员角色，拥有所有权限'),
('USER', '普通用户角色'),
('GUEST', '访客角色');

-- 为管理员角色分配所有权限
INSERT INTO role_permissions (roleId, permissionId)
SELECT 1, id FROM permissions;

-- 为普通用户角色分配部分权限
INSERT INTO role_permissions (roleId, permissionId)
SELECT 2, id FROM permissions WHERE name IN ('user:view', 'role:view', 'permission:view');

-- 创建管理员用户 (密码: Admin123!)
INSERT INTO users (username, email, password, enabled, provider, providerId, avatar)
VALUES ('admin', 'admin@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 'local', '', '');

-- 为管理员分配角色
INSERT INTO user_roles (userId, roleId) VALUES (1, 1);

-- 创建测试用户 (密码: User123!)
INSERT INTO users (username, email, password, enabled, provider, providerId, avatar)
VALUES ('user', 'user@example.com', '$2b$10$X7WfWfWfWfWfWfWfWfWfWeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 'local', '', '');

-- 为测试用户分配角色
INSERT INTO user_roles (userId, roleId) VALUES (2, 2);
