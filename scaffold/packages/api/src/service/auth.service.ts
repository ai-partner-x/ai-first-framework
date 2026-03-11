import 'reflect-metadata';
import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { UserMapper } from '../mapper/user.mapper.js';
import type { LoginDto, LoginResultDto } from '../dto/auth.dto.js';

@Service()
export class AuthService {
  @Autowired()
  private userMapper!: UserMapper;

  async login(dto: LoginDto): Promise<LoginResultDto> {
    const user = await this.userMapper.selectByUsername(dto.username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    if (user.passwordHash !== dto.password) {
      throw new Error('用户名或密码错误');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
