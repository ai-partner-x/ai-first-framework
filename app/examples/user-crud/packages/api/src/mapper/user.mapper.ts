import 'reflect-metadata';
import { Mapper, BaseMapper } from '@ai-first/orm';
import { User } from '../entity/user.entity.js';

@Mapper(User)
export class UserMapper extends BaseMapper<User> {
  async selectByUsername(username: string): Promise<User | null> {
    const users = await this.selectList({ username });
    return users.length > 0 ? users[0] : null;
  }

  async selectByEmail(email: string): Promise<User | null> {
    const users = await this.selectList({ email });
    return users.length > 0 ? users[0] : null;
  }
}
