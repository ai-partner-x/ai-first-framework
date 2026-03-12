import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { Public, PreAuthorize, RolesAllowed, Secured } from '@ai-partner-x/aiko-boot-starter-security';
import { UserService } from '../service/user.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { User } from '../entity/user.entity.js';

@RestController({ path: '/users' })
export class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<User[]> {
    return this.userService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async getById(@PathVariable('id') id: number): Promise<User> {
    return this.userService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<User>): Promise<User> {
    return this.userService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.userService.delete(id);
  }

  @PostMapping('/{id}/roles')
  @PreAuthorize("hasRole('ADMIN')")
  async assignRole(@PathVariable('id') userId: number, @RequestBody() body: { roleId: number }): Promise<void> {
    return this.userService.assignRoleToUser(userId, body.roleId);
  }

  @DeleteMapping('/{id}/roles/{roleId}')
  @PreAuthorize("hasRole('ADMIN')")
  async removeRole(@PathVariable('id') userId: number, @PathVariable('roleId') roleId: number): Promise<void> {
    return this.userService.removeRoleFromUser(userId, roleId);
  }
}
