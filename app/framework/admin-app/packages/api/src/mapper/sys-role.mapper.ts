import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { SysRole } from '../entity/sys-role.entity.js';

@Mapper(SysRole)
export class SysRoleMapper extends BaseMapper<SysRole> {}
