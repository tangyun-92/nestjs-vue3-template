import { GlobalStatus } from "src/types/global.types";

export interface QueryMenuDto {
  keywords?: string;
  menuName?: string;
  status?: string;
}

// 创建菜单DTO
export interface CreateMenuDto {
  parentId: number;
  menuName: string;
  orderNum: number;
  path: string;
  component?: string;
  queryParam?: string;
  isFrame?: string;
  isCache?: string;
  menuType: string;  // 'M'=目录 'C'=菜单 'F'=按钮
  visible?: string;
  status?: string;
  icon?: string;
  remark?: string;
  query?: string;
  perms?: string;
}

// 更新菜单DTO
export interface UpdateMenuDto {
  menuId: number;
  parentId?: number;
  menuName?: string;
  orderNum?: number;
  path?: string;
  component?: string;
  queryParam?: string;
  isFrame?: string;
  isCache?: string;
  menuType?: string;
  visible?: string;
  status?: string;
  icon?: string;
  remark?: string;
  query?: string;
  perms?: string;
}

// 菜单树形选项
export interface MenuTreeOptionDto {
  id: number;
  label: string;
  parentId: number;
  weight: number;
  children?: MenuTreeOptionDto[];
}

// 角色菜单树
export interface RoleMenuTreeDto {
  menus: MenuTreeOptionDto[];
  checkedKeys: number[];
}

// 菜单响应DTO
export interface MenuDataDto {
  menuId: number;
  parentId: number;
  parentName: string;
  menuName: string;
  orderNum: number;
  path: string;
  component: string;
  queryParam: string;
  isFrame: string;
  isCache: string;
  menuType: string;
  visible: string;
  status: string;
  icon: string;
  remark: string;
  createTime: string | Date;
  updateTime: string | Date;
  children?: MenuDataDto[];
}

// 菜单类型枚举
export enum MenuType {
  DIRECTORY = 'M',  // 目录
  MENU = 'C',      // 菜单
  BUTTON = 'F',    // 按钮
}