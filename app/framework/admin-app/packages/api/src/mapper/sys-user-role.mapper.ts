import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { SysUserRole } from '../entity/sys-user-role.entity.js';

@Mapper(SysUserRole)
export class SysUserRoleMapper extends BaseMapper<SysUserRole> {}
