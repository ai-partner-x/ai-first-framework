import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { RoleMenu } from '../entity/role-menu.entity.js';

@Mapper(RoleMenu)
export class RoleMenuMapper extends BaseMapper<RoleMenu> {}

