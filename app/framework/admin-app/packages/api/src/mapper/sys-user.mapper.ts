import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { SysUser } from '../entity/sys-user.entity.js';

@Mapper(SysUser)
export class SysUserMapper extends BaseMapper<SysUser> {
  async selectByUsername(username: string): Promise<SysUser | null> {
    const list = await this.selectList({ username });
    return list.length > 0 ? list[0] : null;
  }
}
