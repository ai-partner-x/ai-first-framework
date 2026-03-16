import { IsEmail, IsNotEmpty, IsArray } from '@ai-partner-x/aiko-boot-starter-validation';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;

  @IsArray({ message: '角色必须是数组' })
  roleIds!: number[];
}
