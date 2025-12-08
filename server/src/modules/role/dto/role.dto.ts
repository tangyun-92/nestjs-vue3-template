// 查询参数DTO
export interface QueryRoleDto {
  pageNum?: number;
  pageSize?: number;
  roleName?: string;
  roleKey?: string;
  status?: string;
  params?: {
    beginTime?: string;
    endTime?: string;
  };
}

// 创建角色DTO
export interface CreateRoleDto {
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: string;
  remark?: string;
  menuIds?: number[];  // 菜单ID数组
  deptIds?: number[];  // 部门ID数组
}

// 更新角色DTO
export interface UpdateRoleDto {
  roleId: number;
  roleName?: string;
  roleKey?: string;
  roleSort?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: string;
  remark?: string;
  menuIds?: number[];  // 菜单ID数组
  deptIds?: number[];  // 部门ID数组
}

// 数据库返回的角色数据
export interface RoleDataBaseDto {
  roleId: number;
  tenantId: string;
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope: string;
  menuCheckStrictly: boolean;
  deptCheckStrictly: boolean;
  status: string;
  delFlag: string;
  createDept?: number;
  createBy?: number;
  updateBy?: number;
  createTime: Date;
  updateTime: Date;
  remark?: string;
}

// 响应角色数据
export interface RoleDataDto extends Omit<RoleDataBaseDto, 'createTime' | 'updateTime'> {
  createTime: string;
  updateTime: string;
}

// 分配角色权限DTO
export interface AssignRoleMenuDto {
  roleId: number;
  menuIds: number[];
}

// 分配角色部门DTO
export interface AssignRoleDeptDto {
  roleId: number;
  deptIds: number[];
}

// 角色状态枚举
export enum RoleStatus {
  NORMAL = '0',  // 正常
  DISABLED = '1',  // 停用
}

// 数据范围枚举
export enum DataScope {
  ALL = '1',  // 全部数据权限
  CUSTOM = '2',  // 自定数据权限
  DEPT = '3',  // 本部门数据权限
  DEPT_AND_CHILD = '4',  // 本部门及以下数据权限
  SELF = '5',  // 仅本人数据权限
  DEPT_AND_SELF = '6',  // 部门及以下或本人数据权限
}