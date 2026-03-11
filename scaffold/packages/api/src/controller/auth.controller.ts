import 'reflect-metadata';
import { RestController, PostMapping, RequestBody } from '@ai-partner-x/aiko-boot-starter-web';
import { Autowired } from '@ai-partner-x/aiko-boot';
import { AuthService } from '../service/auth.service.js';
import type { LoginDto, LoginResultDto } from '../dto/auth.dto.js';

@RestController({ path: '/auth' })
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @PostMapping('/login')
  async login(@RequestBody() dto: LoginDto): Promise<LoginResultDto> {
    return this.authService.login(dto);
  }
}
