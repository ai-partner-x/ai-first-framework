import { IsNotEmpty, IsEmail, IsOptional, Length, Min, Max, IsInt } from '@ai-partner-x/aiko-boot-starter-validation';
import { JsonFormat } from '@ai-partner-x/aiko-boot-starter-web';
import { User } from '../entity/user.entity.js';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(2, 50, { message: '用户名长度必须在 2-50 之间' })
  username!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @IsOptional()
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @Length(2, 50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;
}

/**
 * 批量更新年龄请求 DTO
 */
export class BatchUpdateAgeDto {
  @IsNotEmpty({ message: '用户名关键字不能为空' })
  username!: string;

  @IsNotEmpty({ message: '年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age!: number;
}

/**
 * 更新邮箱请求 DTO
 */
export class UpdateEmailDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;
}

/**
 * 批量删除请求 DTO
 */
export class BatchDeleteDto {
  @IsNotEmpty({ message: '最小年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  minAge!: number;

  @IsNotEmpty({ message: '最大年龄不能为空' })
  @IsInt({ message: '年龄必须是整数' })
  @Max(150, { message: '年龄不能大于 150' })
  maxAge!: number;
}

/**
 * 操作成功响应 DTO
 */
export class SuccessResponse {
  success!: boolean;
}

/**
 * 更新操作响应 DTO
 */
export class UpdateResponse {
  success!: boolean;
  updated!: number;
}

/**
 * 删除操作响应 DTO
 */
export class DeleteResponse {
  success!: boolean;
  deleted!: number;
}

/**
 * 用户搜索结果 DTO
 */
export class UserSearchResultDto {
  data!: User[];
  total!: number;
  page!: number;
  pageSize!: number;
}

/**
 * 用户响应 DTO - 用于 @JsonFormat 日期格式化
 *
 * @example
 * 返回的 Date 字段会自动格式化为指定格式：
 * - createdAt: "2024-01-15 18:30:00" (GMT+8)
 * - updatedAt: 1709971200000 (Unix 毫秒时间戳)
 */
export class UserResponseDto {
  id!: number;
  username!: string;
  email!: string;
  age?: number;

  @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'GMT+8' })
  createdAt?: Date;

  @JsonFormat({ shape: 'NUMBER' })
  updatedAt?: Date;
}

/**
 * 用户过滤 DTO - 用于 @ModelAttribute 绑定示例
 * 支持从 URL query string 或 application/x-www-form-urlencoded body 自动绑定
 *
 * 注：URL query string 的值始终以字符串形式传递，因此数值型字段（如 minAge、page 等）
 * 在此 DTO 中声明为 string 类型，并在 Controller 中按需转换为 number。
 *
 * @example
 * GET /api/users/filter?username=alice&minAge=18&maxAge=30&page=1&pageSize=5
 */
export class UserFilterDto {
  /** 用户名关键字（模糊搜索） */
  username?: string;

  /** 邮箱关键字（模糊搜索） */
  email?: string;

  /** 最小年龄（字符串，来自 query string，Controller 层转换为 number） */
  minAge?: string;

  /** 最大年龄（字符串，来自 query string，Controller 层转换为 number） */
  maxAge?: string;

  /** 页码（字符串，来自 query string，Controller 层转换为 number，默认 1） */
  page?: string;

  /** 每页条数（字符串，来自 query string，Controller 层转换为 number，默认 10） */
  pageSize?: string;

  /** 排序字段 */
  orderBy?: string;

  /** 排序方向: 'asc' | 'desc' */
  orderDir?: string;
}
