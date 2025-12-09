// 查询岗位参数DTO
export interface QueryPostDto {
  pageNum?: number;
  pageSize?: number;
  deptId?: number;
  belongDeptId?: number;
  postCode?: string;
  postName?: string;
  postCategory?: string;
  status?: string;
}

// 创建岗位DTO
export interface CreatePostDto {
  deptId: number;
  postCode: string;
  postName: string;
  postCategory?: string;
  postSort: number;
  status: string;
  remark?: string;
}

// 更新岗位DTO
export interface UpdatePostDto {
  postId: number;
  deptId?: number;
  postCode?: string;
  postName?: string;
  postCategory?: string;
  postSort?: number;
  status?: string;
  remark?: string;
}

// 岗位响应DTO
export interface PostDataDto {
  postId: number;
  tenantId: string;
  deptId: number;
  postCode: string;
  postCategory?: string;
  postName: string;
  postSort: number;
  status: string;
  createDept?: number;
  createBy?: number;
  updateBy?: number;
  createTime: string | Date;
  updateTime: string | Date;
  remark?: string;
  // 关联字段
  deptName?: string;
}

// 岗位选项DTO
export interface PostOptionDto {
  postId: number;
  postCode: string;
  postName: string;
  deptId: number;
}

// 岗位状态枚举
export enum PostStatus {
  NORMAL = '0',  // 正常
  DISABLED = '1',  // 停用
}

// 岗位树形结构DTO（用于部门树选择）
export interface PostDeptTreeDto {
  id: number;
  label: string;
  parentId: number;
  children?: PostDeptTreeDto[];
}