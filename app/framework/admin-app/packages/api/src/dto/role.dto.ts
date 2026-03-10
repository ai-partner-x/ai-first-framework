export class CreateRoleDto {
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
