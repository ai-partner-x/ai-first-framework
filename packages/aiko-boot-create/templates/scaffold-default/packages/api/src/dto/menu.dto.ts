export class CreateMenuDto {
  parentId: number = 0;
  menuName!: string;
  menuType!: number; // 1目录 2菜单 3按钮
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sortOrder: number = 0;
  status: number = 1;
}

export class UpdateMenuDto {
  parentId?: number;
  menuName?: string;
  menuType?: number;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sortOrder?: number;
  status?: number;
}

export interface MenuTreeVo {
  id: number;
  parentId: number;
  menuName: string;
  menuType: number;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sortOrder: number;
  status: number;
  children?: MenuTreeVo[];
}
