import { describe, it, expect } from 'vitest';
import { CreateRoleDto, UpdateRoleDto } from '../../src/dto/role.dto.js';

describe('Role DTO', () => {
  describe('CreateRoleDto', () => {
    it('should create CreateRoleDto with required fields', () => {
      const dto = new CreateRoleDto();
      dto.roleCode = 'admin';
      dto.roleName = '管理员';

      expect(dto.roleCode).toBe('admin');
      expect(dto.roleName).toBe('管理员');
      expect(dto.status).toBe(1);
    });

    it('should allow optional fields', () => {
      const dto = new CreateRoleDto();
      dto.roleCode = 'editor';
      dto.roleName = '编辑角色';
      dto.description = '负责内容编辑';
      dto.menuIds = [1, 2, 3];

      expect(dto.description).toBe('负责内容编辑');
      expect(dto.menuIds).toEqual([1, 2, 3]);
    });
  });

  describe('UpdateRoleDto', () => {
    it('should create UpdateRoleDto with optional fields', () => {
      const dto = new UpdateRoleDto();
      dto.roleName = '新角色名';
      dto.description = '更新描述';
      dto.status = 0;
      dto.menuIds = [1, 2];

      expect(dto.roleName).toBe('新角色名');
      expect(dto.description).toBe('更新描述');
      expect(dto.status).toBe(0);
      expect(dto.menuIds).toEqual([1, 2]);
    });

    it('should allow undefined fields', () => {
      const dto = new UpdateRoleDto();

      expect(dto.roleName).toBeUndefined();
      expect(dto.description).toBeUndefined();
      expect(dto.status).toBeUndefined();
      expect(dto.menuIds).toBeUndefined();
    });
  });
});
