import { UserSex } from "src/entities/user.entity";
import { GlobalStatus } from "src/types/global.types";

export interface QueryUserDto {
  userName?: string;
  status?: GlobalStatus;
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
}

export interface UserDataBaseDto {
  userId?: number;
  deptId?: number;
  userName?: string;
  nickName?: string;
  userType?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: number;
  password?: string;
  status?: string;
  delFlag?: string;
  loginIp?: string;
  loginDate?: Date;
  remark?: string;
  createTime?: Date;
  updateTime?: Date;
}