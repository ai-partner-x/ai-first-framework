import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { UserRole } from '../entity/user-role.entity.js';

@Mapper(UserRole)
export class UserRoleMapper extends BaseMapper<UserRole> {}
