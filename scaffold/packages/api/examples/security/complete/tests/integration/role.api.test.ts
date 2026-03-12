import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { RoleService } from '../../service/role.service.js';
import { PermissionService } from '../../service/permission.service.js';
import { Role, Permission } from '../../entity/index.js';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';

describe('Role API Integration Tests', () => {
  let app: express.Application;
  let roleService: RoleService;
  let permissionService: PermissionService;

  const mockAdminUser: any = {
    id: 1,
    username: 'admin',
    roles: [{ id: 1, name: 'ADMIN', description: '管理员', createdAt: new Date(), updatedAt: new Date() }],
  };

  const mockRegularUser: any = {
    id: 2,
    username: 'user',
    roles: [{ id: 2, name: 'USER', description: '普通用户', createdAt: new Date(), updatedAt: new Date() }],
  };

  const mockAdminRole: Role = {
    id: 1,
    name: 'ADMIN',
    description: '管理员',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
  };

  const mockUserRole: Role = {
    id: 2,
    name: 'USER',
    description: '普通用户',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
  };

  const mockPermissions: Permission[] = [
    {
      id: 1,
      name: 'user:view',
      description: '查看用户',
      resource: 'user',
      action: 'view',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'user:create',
      description: '创建用户',
      resource: 'user',
      action: 'create',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    roleService = new RoleService();
    permissionService = new PermissionService();

    (roleService as any).roleMapper = {
      selectList: jest.fn(),
      selectById: jest.fn(),
      insert: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    (roleService as any).rolePermissionMapper = {
      selectList: jest.fn(),
      insert: jest.fn(),
      deleteById: jest.fn(),
    };

    (roleService as any).permissionService = permissionService;

    (permissionService as any).permissionMapper = {
      selectById: jest.fn(),
    };

    (permissionService as any).rolePermissionMapper = {
      selectList: jest.fn(),
    };

    const checkAdminPermission = (req: any, res: any, next: any) => {
      const securityContext = SecurityContext.getInstance();
      const currentUser = securityContext.getCurrentUser();

      if (!currentUser) {
        return res.status(401).json({ error: '未授权' });
      }

      const hasAdminRole = currentUser.roles?.some((r: Role) => r.name === 'ADMIN');
      if (!hasAdminRole) {
        return res.status(403).json({ error: '禁止访问' });
      }

      next();
    };

    app.get('/api/roles', checkAdminPermission, async (req, res) => {
      try {
        const roles = await roleService.findAll();
        res.json(roles);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/roles/:id', checkAdminPermission, async (req, res) => {
      try {
        const role = await roleService.findById(parseInt(req.params.id));
        if (!role) {
          return res.status(404).json({ error: '角色不存在' });
        }
        res.json(role);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/roles', checkAdminPermission, async (req, res) => {
      try {
        const role = await roleService.create(req.body);
        res.json(role);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/api/roles/:id', checkAdminPermission, async (req, res) => {
      try {
        const role = await roleService.update(parseInt(req.params.id), req.body);
        res.json(role);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/roles/:id', checkAdminPermission, async (req, res) => {
      try {
        const result = await roleService.delete(parseInt(req.params.id));
        res.json({ success: result });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/roles/:id/permissions', checkAdminPermission, async (req, res) => {
      try {
        await roleService.assignPermissionToRole(parseInt(req.params.id), req.body.permissionId);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/roles/:id/permissions/:permissionId', checkAdminPermission, async (req, res) => {
      try {
        await roleService.removePermissionFromRole(parseInt(req.params.id), parseInt(req.params.permissionId));
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

  describe('GET /api/roles', () => {
    it('管理员应该能获取所有角色', async () => {
      ((roleService as any).roleMapper.selectList as jest.Mock).mockResolvedValue([mockAdminRole, mockUserRole]);
      (permissionService.getRolePermissions as jest.Mock).mockResolvedValue([]);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/roles')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('ADMIN');
      expect(response.body[1].name).toBe('USER');
    });

    it('普通用户应该被拒绝访问', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .get('/api/roles')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });

    it('未登录用户应该被拒绝访问', async () => {
      const response = await request(app)
        .get('/api/roles')
        .expect(401);

      expect(response.body).toHaveProperty('error', '未授权');
    });
  });

  describe('GET /api/roles/:id', () => {
    it('管理员应该能获取角色详情', async () => {
      ((roleService as any).roleMapper.selectById as jest.Mock).mockResolvedValue(mockAdminRole);
      (permissionService.getRolePermissions as jest.Mock).mockResolvedValue(mockPermissions);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/roles/1')
        .expect(200);

      expect(response.body.name).toBe('ADMIN');
      expect(response.body.permissions).toHaveLength(2);
    });

    it('应该返回 404 当角色不存在', async () => {
      ((roleService as any).roleMapper.selectById as jest.Mock).mockResolvedValue(null);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .get('/api/roles/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', '角色不存在');
    });
  });

  describe('POST /api/roles', () => {
    it('管理员应该能创建新角色', async () => {
      const newRole = {
        name: 'MODERATOR',
        description: '版主',
      };

      ((roleService as any).roleMapper.insert as jest.Mock).mockResolvedValue(3);
      ((roleService as any).roleMapper.selectById as jest.Mock).mockResolvedValue({
        id: 3,
        ...newRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .post('/api/roles')
        .send(newRole)
        .expect(200);

      expect(response.body.name).toBe('MODERATOR');
    });

    it('普通用户应该被拒绝创建角色', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .post('/api/roles')
        .send({
          name: 'MODERATOR',
          description: '版主',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('PUT /api/roles/:id', () => {
    it('管理员应该能更新角色', async () => {
      const updateData = { description: '更新后的描述' };

      ((roleService as any).roleMapper.updateById as jest.Mock).mockResolvedValue(1);
      ((roleService as any).roleMapper.selectById as jest.Mock).mockResolvedValue({
        ...mockAdminRole,
        description: '更新后的描述',
      });

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .put('/api/roles/1')
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe('更新后的描述');
    });

    it('普通用户应该被拒绝更新角色', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .put('/api/roles/1')
        .send({ description: '更新后的描述' })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('管理员应该能删除角色', async () => {
      ((roleService as any).rolePermissionMapper.selectList as jest.Mock).mockResolvedValue([]);
      ((roleService as any).roleMapper.deleteById as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .delete('/api/roles/2')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝删除角色', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .delete('/api/roles/2')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('POST /api/roles/:id/permissions', () => {
    it('管理员应该能为角色分配权限', async () => {
      ((roleService as any).rolePermissionMapper.insert as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .post('/api/roles/1/permissions')
        .send({ permissionId: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝分配权限', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .post('/api/roles/1/permissions')
        .send({ permissionId: 1 })
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });

  describe('DELETE /api/roles/:id/permissions/:permissionId', () => {
    it('管理员应该能移除角色权限', async () => {
      ((roleService as any).rolePermissionMapper.selectList as jest.Mock).mockResolvedValue([
        { id: 1, roleId: 1, permissionId: 1, createdAt: new Date() },
      ]);
      ((roleService as any).rolePermissionMapper.deleteById as jest.Mock).mockResolvedValue(1);

      SecurityContext.getInstance().setCurrentUser(mockAdminUser);

      const response = await request(app)
        .delete('/api/roles/1/permissions/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('普通用户应该被拒绝移除权限', async () => {
      SecurityContext.getInstance().setCurrentUser(mockRegularUser);

      const response = await request(app)
        .delete('/api/roles/1/permissions/1')
        .expect(403);

      expect(response.body).toHaveProperty('error', '禁止访问');
    });
  });
});
