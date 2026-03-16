import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { Role } from '../entity/role.entity.js';

@Mapper(Role)
export class RoleMapper extends BaseMapper<Role> {}

