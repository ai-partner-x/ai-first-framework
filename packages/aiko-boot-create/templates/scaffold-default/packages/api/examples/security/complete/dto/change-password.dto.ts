import { IsNotEmpty, MinLength } from '@ai-partner-x/aiko-boot-starter-validation';

export class ChangePasswordDto {
  @IsNotEmpty({ message: '旧密码不能为空' })
  oldPassword!: string;

  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '新密码长度至少 8 位' })
  newPassword!: string;
}
