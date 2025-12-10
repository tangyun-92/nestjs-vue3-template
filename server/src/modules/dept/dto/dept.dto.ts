// 查询部门参数DTO
export interface QueryDeptDto {
  pageNum?: number;
  pageSize?: number;
  deptName?: string;
  deptCategory?: string;
  status?: string;
}

// 创建部门DTO
export interface CreateDeptDto {
  parentId: number;
  deptName: string;
  deptCategory?: string;
  orderNum: number;
  leader?: number;
  phone?: string;
  email?: string;
  status?: string;
}

// 更新部门DTO
export interface UpdateDeptDto {
  deptId: number;
  parentId?: number;
  deptName?: string;
  deptCategory?: string;
  orderNum?: number;
  leader?: number;
  phone?: string;
  email?: string;
  status?: string;
}

// 部门树形结构DTO
export interface DeptTreeDto {
  id: number;
  label: string;
  parentId: number;
  weight: number;
  children: DeptTreeDto[];
  disabled?: boolean;
}

// 部门响应DTO
export interface DeptDataDto {
  deptId: number;
  tenantId: string;
  parentId: number;
  ancestors: string;
  deptName: string;
  deptCategory?: string;
  orderNum: number;
  leader?: number;
  phone?: string;
  email?: string;
  status: string;
  delFlag: string;
  createDept?: number;
  createBy?: number;
  updateBy?: number;
  createTime: string | Date;
  updateTime: string | Date;
  children?: DeptDataDto[];
}

// 部门选项DTO
export interface DeptOptionDto {
  deptId: number;
  deptName: string;
  parentId: number;
}

// 岗位选项DTO
export interface PostOptionDto {
  postId: number;
  deptId: number;
  postCode: string;
  postName: string;
  postCategory: string | null;
  postSort: number;
  status: string;
  remark: string;
  createTime: string;
  deptName: string;
}

// 部门状态枚举
export enum DeptStatus {
  NORMAL = '0',  // 正常
  DISABLED = '1',  // 停用
}

// 删除标志枚举
export enum DelFlag {
  EXISTS = '0',  // 存在
  DELETED = '1',  // 删除
}