import { IsNotEmpty } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreatePermissionDto {
  @IsNotEmpty({ message: '权限名称不能为空' })
  name!: string;

  description?: string;

  @IsNotEmpty({ message: '资源不能为空' })
  resource!: string;

  @IsNotEmpty({ message: '操作不能为空' })
  action!: string;
}
