import { UserSex } from "src/entities/user.entity";
import { GlobalStatus } from "src/types/global.types";

export interface QueryUserDto {
  user_name?: string;
  status?: GlobalStatus;
  page?: number;
  pageSize?: number;
}

export interface CreateUserDto {
  user_name: string;
  nick_name: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex?: UserSex;
  status?: GlobalStatus;
  remark?: string;
}

export interface UserDataBaseDto {
  user_id?: number;
  dept_id?: number;
  user_name?: string;
  nick_name?: string;
  user_type?: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  password?: string;
  status?: GlobalStatus;
  del_flag?: GlobalStatus;
  login_ip?: string;
  login_date?: Date;
  remark?: string;
  created_time?: Date;
  updated_time?: Date;
}