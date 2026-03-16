import { IsNotEmpty } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreateRoleDto {
  @IsNotEmpty({ message: '角色编码不能为空' })
  roleCode!: string;
  roleName!: string;
  description?: string;
  status: number = 1;
  menuIds?: number[];
}

export class UpdateRoleDto {
  roleName?: string;
  description?: string;
  status?: number;
  menuIds?: number[];
}

