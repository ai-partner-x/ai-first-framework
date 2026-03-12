import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { UserService } from '../../service/user.service.js';
import { RoleService } from '../../service/role.service.js';
import { PermissionService } from '../../service/permission.service.js';
import { User, Role, Permission } from '../../entity/index.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';

describe('User API Integration Tests', () => {
  let app: express.Application;
  let userService: UserService;
  let roleService: RoleService;
  let permissionService: PermissionService;

  const mockAdminUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashedpassword',
    enabled: true,
    provider: 'local',
    providerId: '',
    avatar: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ id: 1, name: 'ADMIN', description: '管理员', createdAt: new Date(), updatedAt: new Date() }],
    permissions: [],
  };

  const mockRegularUser: User = {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    password: 'hashedpassword',
    enabled: true,
    provider: 'local',
    providerId: '',
    avatar: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ id: 2, name: 'USER', description: '普通用户', createdAt: new Date(), updatedAt: new Date() }],
    permissions: [],
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    userService = new UserService();
    roleService = new RoleService();
    permissionService = new PermissionService();

    (userService as any).userMapper = {
      selectList: jest.fn(),
      selectById: jest.fn(),
      insert: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    (userService as any).roleMapper = {
      selectById: jest.fn(),
    };

    (userService as any).userRoleMapper = {
      selectList: jest.fn(),
      insert: jest.fn(),
      deleteById: jest.fn(),
    };

    (userService as any).permissionService = permissionService;

    (permissionService as any).userMapper = {
      selectById: jest.fn(),
    };

    (permissionService as any).userRoleMapper = {
      selectList: jest.fn(),
    };

    (permissionService as any).rolePermissionMapper = {
      selectList: jest.fn(),
    };

    (permissionService as any).permissionMapper = {
      selectById: jest.fn(),
    };

    const checkPermission = (req: any, res: any, next: any) => {
      const securityContext = SecurityContext.getInstance();
      const currentUser = securityContext.getCurrentUser();

      if (!currentUser) {
        return res.status(401).json({ error: '未授权' });
      }

      const hasAdminRole = currentUser.roles?.some((r: Role) => r.name === 'ADMIN');
      const isSelf = req.params.id && parseInt(req.params.id) === currentUser.id;

      if (req.method === 'GET' && req.path.match(/^\/api\/users\/\d+$/) && !hasAdminRole && !isSelf) {
        return res.status(403).json({ error: '禁止访问' });
      }

      if (req.method === 'PUT' && req.path.match(/^\/api\/users\/\d+$/) && !hasAdminRole && !isSelf) {
        return res.status(403).json({ error: '禁止访问' });
      }

      if ((req.method === 'POST' || req.method === 'DELETE') && !hasAdminRole) {
        return res.status(403).json({ error: '禁止访问' });
      }

      next();
    };

    app.get('/api/users', checkPermission, async (req, res) => {
      try {
        const users = await userService.findAll();
        res.json(users);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/users/:id', checkPermission, async (req, res) => {
      try {
        const user = await userService.findById(parseInt(req.params.id));
        if (!user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/users', checkPermission, async (req, res) => {
      try {
        const user = await userService.create(req.body);
        res.json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/api/users/:id', checkPermission, async (req, res) => {
      try {
        const user = await userService.update(parseInt(req.params.id), req.body);
        res.json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/users/:id', checkPermission, async (req, res) => {
      try {
        const result = await userService.delete(parseInt(req.params.id));
        res.json({ success: result });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/users/:id/roles', checkPermission, async (req, res) => {
      try {
        await userService.assignRoleToUser(parseInt(req.params.id), req.body.roleId);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/users/:id/roles/:roleId', checkPermission, async (req, res) => {
      try {
        await userService.removeRoleFromUser(parseInt(req.params.id), parseInt(req.params.roleId));
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  afterAll(async () => {
    SecurityContext.getInstance().setCurrentUser(null);
  });

  beforeEach(() => {
    SecurityContext.getInstance().setCurrentUser(null);
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('管理员应该能获取所有用户', async () => {
      ((userService as any).userMapper.selectList as jest.Mock).mockResolvedValue([mockAdminUser, mockRegularUser]);
      ((userService as any).getUserRoles as jest.Mock).mockResolvedValue(mockAdminUser.roles);
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].username).toBe('admin');
      expect(response.body[1].username).toBe('user');
    });

    it('普通用户应该被拒绝访问', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .get('/api/users')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });

    it('未登录用户应该被拒绝访问', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('error', '未授权');
    });
  });

  describe('GET /api/users/:id', () => {
    it('管理员应该能获取任意用户信息', async () => {
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockRegularUser);
      ((userService as any).getUserRoles as jest.Mock).mockResolvedValue(mockRegularUser.roles);
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/users/2')
        .expect(200);

      expect(response.body.username).toBe('user');
    });

    it('用户应该能获取自己的信息', async () => {
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockRegularUser);
      ((userService as any).getUserRoles as jest.Mock).mockResolvedValue(mockRegularUser.roles);
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .get('/api/users/2')
        .expect(200);

      expect(response.body.username).toBe('user');
    });

    it('用户不应该能获取其他用户的信息', async () => {
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(mockAdminUser);
      ((userService as any).getUserRoles as jest.Mock).mockResolvedValue(mockAdminUser.roles);
      (permissionService.getUserPermissions as jest.Mock).mockResolvedValue([]);

      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });

    it('应该返回 404 当用户不存在', async () => {
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue(null);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', '用户不存在');
    });
  });

  describe('POST /api/users', () => {
    it('管理员应该能创建新用户', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      ((userService as any).userMapper.insert as jest.Mock).mockResolvedValue(3);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue({
        id: 3,
        ...newUser,
        password: 'hashedpassword',
        enabled: true,
        provider: 'local',
        providerId: '',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(200);

      expect(response.body.username).toBe('newuser');
    });

    it('普通用户应该被拒绝创建用户', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('管理员应该能更新任意用户', async () => {
      const updateData = { email: 'updated@example.com' };

      ((userService as any).userMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue({
        ...mockRegularUser,
        email: 'updated@example.com',
      });

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .put('/api/users/2')
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe('updated@example.com');
    });

    it('用户应该能更新自己的信息', async () => {
      const updateData = { email: 'updated@example.com' };

      ((userService as any).userMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((userService as any).userMapper.selectById as jest.Mock).mockResolvedValue({
        ...mockRegularUser,
        email: 'updated@example.com',
      });

      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .put('/api/users/2')
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe('updated@example.com');
    });

    it('用户不应该能更新其他用户的信息', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'updated@example.com' })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('管理员应该能删除用户', async () => {
      ((userService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue([]);
      ((userService as any).userMapper.deleteById as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .delete('/api/users/2')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝删除用户', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .delete('/api/users/2')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('POST /api/users/:id/roles', () => {
    it('管理员应该能为用户分配角色', async () => {
      ((userService as any).userRoleMapper.insert as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .post('/api/users/2/roles')
        .send({ roleId: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝分配角色', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .post('/api/users/2/roles')
        .send({ roleId: 1 })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('DELETE /api/users/:id/roles/:roleId', () => {
    it('管理员应该能移除用户角色', async () => {
      ((userService as any).userRoleMapper.selectList as jest.Mock).mockResolvedValue([
        { id: 1, userId: 2, roleId: 1, createdAt: new Date() },
      ]);
      ((userService as any).userRoleMapper.deleteById as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .delete('/api/users/2/roles/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝移除角色', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .delete('/api/users/2/roles/1')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });
});
