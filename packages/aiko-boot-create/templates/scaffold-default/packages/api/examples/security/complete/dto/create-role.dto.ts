import { IsNotEmpty, IsArray } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreateRoleDto {
  @IsNotEmpty({ message: '角色名称不能为空' })
  name!: string;

  description?: string;

  @IsArray({ message: '权限必须是数组' })
  permissionIds!: number[];
}
