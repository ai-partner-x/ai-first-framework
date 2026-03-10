import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { SysRoleMenu } from '../entity/sys-role-menu.entity.js';

@Mapper(SysRoleMenu)
export class SysRoleMenuMapper extends BaseMapper<SysRoleMenu> {}
