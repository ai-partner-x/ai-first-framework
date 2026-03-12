-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  provider TEXT DEFAULT 'local',
  providerId TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建权限表
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  roleId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(userId, roleId)
);

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roleId INTEGER NOT NULL,
  permissionId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(roleId, permissionId)
);

-- 创建 OAuth 账户表
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  provider TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT DEFAULT '',
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, providerId)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, providerId);
CREATE INDEX IF NOT EXISTS idx_user_roles_userId ON user_roles(userId);
CREATE INDEX IF NOT EXISTS idx_user_roles_roleId ON user_roles(roleId);
CREATE INDEX IF NOT EXISTS idx_role_permissions_roleId ON role_permissions(roleId);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permissionId ON role_permissions(permissionId);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_userId ON oauth_accounts(userId);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, providerId);
