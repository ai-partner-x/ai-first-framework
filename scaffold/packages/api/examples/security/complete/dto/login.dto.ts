import { IsNotEmpty, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

export class LoginDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少 6 位' })
  password!: string;
}
