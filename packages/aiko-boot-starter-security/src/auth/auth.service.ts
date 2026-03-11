import { Service, Transactional, Autowired } from '@ai-partner-x/aiko-boot';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';
// SessionStrategy will be used in future session-based auth
// import { SessionStrategy } from './strategies/session.strategy.js';
import type { User } from '../entities/index.js';
import type { LoginDto, LoginResult } from '../types.js';
import { SENSITIVE_FIELDS } from '../types.js';

export interface UserService {
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
  update(id: number, userData: Partial<User>): Promise<User>;
  delete(id: number): Promise<boolean>;
}

export interface RegisterDto {
  username: string;
  password: string;
  email: string;
}

@Service()
export class AuthService {
  @Autowired()
  private jwtStrategy!: JwtStrategy;

  @Autowired()
  private localStrategy!: LocalStrategy;

  // SessionStrategy will be used in future session-based auth
  // @Autowired()
  // private sessionStrategy!: SessionStrategy;

  private userService: UserService | null = null;

  setUserService(userService: UserService): void {
    this.userService = userService;
  }

  async login(credentials: LoginDto): Promise<LoginResult> {
    if (!this.userService) {
      throw new Error('UserService not configured');
    }

    const user = await this.userService.findByUsername(credentials.username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.enabled) {
      throw new Error('Account is disabled');
    }

    const isValid = await this.localStrategy.verifyPassword(
      user.password || '',
      credentials.password
    );

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = await this.jwtStrategy.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token: token,
      expiresIn: 86400,
    };
  }

  @Transactional()
  async register(userData: RegisterDto): Promise<User> {
    if (!this.userService) {
      throw new Error('UserService not configured');
    }

    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await this.userService.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await this.localStrategy.hashPassword(userData.password);
    return this.userService.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      enabled: true,
    });
  }

  async refreshToken(refreshToken: string): Promise<LoginResult> {
    const user = await this.jwtStrategy.validate(refreshToken);
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const token = await this.jwtStrategy.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token: token,
      expiresIn: 86400,
    };
  }

  async logout(_token: string): Promise<void> {
    // Token invalidation logic can be implemented here
    // For example, add token to a blacklist or invalidate in Redis
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    if (!this.userService) {
      throw new Error('UserService not configured');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.localStrategy.verifyPassword(
      user.password || '',
      oldPassword
    );

    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await this.localStrategy.hashPassword(newPassword);
    await this.userService.update(userId, { password: hashedPassword });

    return true;
  }

  /**
   * Sanitizes user data by removing sensitive fields.
   * This ensures that passwords, tokens, and other sensitive data
   * are never exposed in API responses.
   * 
   * @param user - The user object to sanitize
   * @returns A sanitized user object with sensitive fields removed
   */
  private sanitizeUser(user: User): Partial<User> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveFields = new Set(SENSITIVE_FIELDS);

    for (const key of Object.keys(user)) {
      if (!sensitiveFields.has(key)) {
        sanitized[key] = user[key as keyof User];
      }
    }

    return sanitized as Partial<User>;
  }
}
