import 'reflect-metadata';
import { RestController, PostMapping, GetMapping, RequestBody, RequestParam } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot/di/server';
import { AuthService } from '../service/auth.service.js';
import type { LoginDto, RefreshTokenDto } from '../dto/auth.dto.js';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  async login(@RequestBody() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @PostMapping('/refresh')
  async refresh(@RequestBody() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @GetMapping('/info')
  async getUserInfo(@RequestParam('_uid') userId: string) {
    return this.authService.getUserInfo(Number(userId));
  }
}
