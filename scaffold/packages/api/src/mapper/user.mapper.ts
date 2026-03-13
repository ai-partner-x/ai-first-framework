import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';

@Mapper(User)
export class UserMapper extends BaseMapper<User> {
  async selectByUsername(username: string): Promise<User | null> {
    const user = await this.selectOne({ username });
    return user;
  }
}
