import { IsNotEmpty, Length, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

export class LoginDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(1, 50, { message: '用户名长度必须在 1-50 之间' })
  username!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少 6 位' })
  password!: string;
}

/** 登录成功返回的用户信息（不含密码） */
export class LoginResultDto {
  id!: number;
  username!: string;
  email!: string;
}
