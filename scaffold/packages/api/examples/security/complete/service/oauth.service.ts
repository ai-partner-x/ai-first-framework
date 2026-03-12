import { Service, Autowired } from '@ai-partner-x/aiko-boot';
import { Mapper, BaseMapper } from '@ai-partner-x/aiko-boot-starter-orm';
import { User } from '../entity/user.entity.js';
import { OAuthAccount } from '../entity/oauth-account.entity.js';
import type { OAuthProfileDto } from '../dto/oauth-profile.dto.js';

@Service()
export class OAuthService {
  @Autowired()
  private userMapper!: BaseMapper<User>;

  @Autowired()
  private oauthAccountMapper!: BaseMapper<OAuthAccount>;

  async findOrCreateUser(profile: OAuthProfileDto): Promise<User> {
    let user = await this.findByProvider(profile.provider, profile.providerId);

    if (!user) {
      user = await this.createUser(profile);
    }

    return user;
  }

  async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const accounts = await this.oauthAccountMapper.selectList({
      where: { provider, providerId }
    });

    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    return this.userMapper.selectById(account.userId);
  }

  async createUser(profile: OAuthProfileDto): Promise<User> {
    const user = {
      username: profile.username,
      email: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
      avatar: profile.avatar || '',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userId = await this.userMapper.insert(user);
    return this.userMapper.selectById(userId) as Promise<User>;
  }

  async saveOAuthAccount(userId: number, profile: OAuthProfileDto, tokens: any): Promise<void> {
    const account = {
      userId,
      provider: profile.provider,
      providerId: profile.providerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : new Date(Date.now() + 3600000),
      createdAt: new Date(),
    };

    await this.oauthAccountMapper.insert(account);
  }

  async updateOAuthTokens(userId: number, provider: string, tokens: any): Promise<void> {
    const accounts = await this.oauthAccountMapper.selectList({
      where: { userId, provider }
    });

    if (accounts.length > 0) {
      const account = accounts[0];
      await this.oauthAccountMapper.updateById(account.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || account.refreshToken,
        expiresAt: tokens.expires_at ? new Date(tokens.expires_at * 1000) : account.expiresAt,
      });
    }
  }
}
