export class CreateUserDto {
  username!: string;
  password!: string;
  realName?: string;
  email?: string;
  phone?: string;
  status: number = 1;
  roleIds?: number[];
}

export class UpdateUserDto {
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  roleIds?: number[];
}

export class UserPageDto {
  pageNo: number = 1;
  pageSize: number = 10;
  username?: string;
  status?: number;
}

export interface UserVo {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  status: number;
  roles: string[];
  createdAt?: Date;
}
