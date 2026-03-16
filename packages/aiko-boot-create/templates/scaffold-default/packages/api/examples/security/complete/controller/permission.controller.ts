import { RestController, GetMapping, PostMapping, PutMapping, DeleteMapping, RequestBody, PathVariable } from '@ai-partner-x/aiko-boot-starter-web';
import { PreAuthorize } from '@ai-partner-x/aiko-boot-starter-security';
import { PermissionService } from '../service/permission.service.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { Permission } from '../entity/permission.entity.js';

@RestController({ path: '/permissions' })
export class PermissionController {
  @Autowired()
  private permissionService!: PermissionService;

  @GetMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async list(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @GetMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async getById(@PathVariable('id') id: number): Promise<Permission> {
    return this.permissionService.findById(id);
  }

  @PostMapping()
  @PreAuthorize("hasRole('ADMIN')")
  async create(@RequestBody() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(dto);
  }

  @PutMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async update(@PathVariable('id') id: number, @RequestBody() dto: Partial<Permission>): Promise<Permission> {
    return this.permissionService.update(id, dto);
  }

  @DeleteMapping('/{id}')
  @PreAuthorize("hasRole('ADMIN')")
  async delete(@PathVariable('id') id: number): Promise<boolean> {
    return this.permissionService.delete(id);
  }
}
