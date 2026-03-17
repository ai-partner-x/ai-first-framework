import { describe, it, expect } from 'vitest';
import { CreateUserDto, UpdateUserDto, UserPageDto, UserVo } from '../../src/dto/user.dto.js';

describe('User DTO', () => {
  describe('CreateUserDto', () => {
    it('should create CreateUserDto with required fields', () => {
      const dto = new CreateUserDto();
      dto.username = 'testuser';
      dto.password = 'password123';

      expect(dto.username).toBe('testuser');
      expect(dto.password).toBe('password123');
      expect(dto.status).toBe(1);
    });

    it('should allow optional fields', () => {
      const dto = new CreateUserDto();
      dto.username = 'testuser';
      dto.password = 'password123';
      dto.realName = '测试用户';
      dto.email = 'test@example.com';
      dto.phone = '13800138000';
      dto.roleIds = [1, 2];

      expect(dto.realName).toBe('测试用户');
      expect(dto.email).toBe('test@example.com');
      expect(dto.phone).toBe('13800138000');
      expect(dto.roleIds).toEqual([1, 2]);
    });
  });

  describe('UpdateUserDto', () => {
    it('should create UpdateUserDto with optional fields', () => {
      const dto = new UpdateUserDto();
      dto.realName = '更新用户';
      dto.email = 'update@example.com';
      dto.status = 0;
      dto.roleIds = [1];

      expect(dto.realName).toBe('更新用户');
      expect(dto.email).toBe('update@example.com');
      expect(dto.status).toBe(0);
      expect(dto.roleIds).toEqual([1]);
    });
  });

  describe('UserPageDto', () => {
    it('should have default values', () => {
      const dto = new UserPageDto();

      expect(dto.pageNo).toBe(1);
      expect(dto.pageSize).toBe(10);
      expect(dto.username).toBeUndefined();
      expect(dto.status).toBeUndefined();
    });

    it('should allow setting all fields', () => {
      const dto = new UserPageDto();
      dto.pageNo = 2;
      dto.pageSize = 20;
      dto.username = 'admin';
      dto.status = 1;

      expect(dto.pageNo).toBe(2);
      expect(dto.pageSize).toBe(20);
      expect(dto.username).toBe('admin');
      expect(dto.status).toBe(1);
    });
  });

  describe('UserVo', () => {
    it('should create UserVo instance', () => {
      const vo: UserVo = {
        id: 1,
        username: 'admin',
        realName: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        status: 1,
        roles: ['admin', 'user'],
        createdAt: new Date('2024-01-01'),
      };

      expect(vo.id).toBe(1);
      expect(vo.username).toBe('admin');
      expect(vo.realName).toBe('管理员');
      expect(vo.email).toBe('admin@example.com');
      expect(vo.status).toBe(1);
      expect(vo.roles).toContain('admin');
    });
  });
});
