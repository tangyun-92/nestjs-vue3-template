import { UserSex } from "src/entities/user.entity";
import { GlobalStatus } from "src/types/global.types";

export interface QueryUserDto {
  userName?: string;
  nickName?: string;
  phonenumber?: string;
  status?: GlobalStatus;
  deptId?: number;
  roleId?: number;
  userIds?: string | number | (string | number)[];
  page?: number;
  pageSize?: number;
}

export interface CreateUserDto {
  userName: string;
  nickName: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex?: UserSex;
  status?: GlobalStatus;
  remark?: string;
  deptId?: number;
  postIds?: number[];
  roleIds?: number[];
}

export interface UpdateUserDto {
  userId: number;
  deptId?: number | string;
  userName?: string;
  nickName?: string;
  password?: string;
  phonenumber?: string;
  email?: string;
  sex?: string | number;
  status?: string;
  remark?: string;
  postIds?: (string | number)[] | null;
  roleIds?: (string | number)[] | null;
  tenantId?: string;
  userType?: string;
  avatar?: any;
  delFlag?: string;
  loginIp?: string;
  loginDate?: string;
  createDept?: any;
  createBy?: any;
  createTime?: string;
  updateBy?: any;
  updateTime?: string;
  deptName?: string;
  roles?: any[];
  roleId?: string | number;
}

export interface UserDataBaseDto {
  userId?: number;
  tenantId?: string;
  deptId?: number;
  userName?: string;
  nickName?: string;
  userType?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: number | string;  // 兼容两种类型
  password?: string;
  status?: string;
  delFlag?: string;
  loginIp?: string;
  loginDate?: Date;
  remark?: string;
  createTime?: Date | string;  // 兼容两种类型
  updateTime?: Date | string;  // 兼容两种类型
  deptName?: string;
  roles?: any[];
  roleIds?: any;
  roleId?: number;
  postIds?: any;
  admin?: boolean;
}

export interface UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  userId: number;
  password: string;
}

export interface ChangeStatusDto {
  userId: number;
  status: GlobalStatus;
}

export interface AssignRoleDto {
  userId: number;
  roleIds: number[];
}

export interface UserVO extends Omit<UserDataBaseDto, 'password'> {
  createTime?: string;
  updateTime?: string;
}

export interface UserDetailResponse {
  user: UserDataBaseDto;
  roleIds: number[];
  roles: any[];
  postIds: number[];
  posts: any[];
}