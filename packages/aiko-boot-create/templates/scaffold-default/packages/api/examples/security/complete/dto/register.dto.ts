import { IsEmail, IsNotEmpty, MinLength, Matches } from '@ai-partner-x/aiko-boot-starter-validation';

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名长度至少 3 位' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度至少 8 位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  })
  password!: string;
}
