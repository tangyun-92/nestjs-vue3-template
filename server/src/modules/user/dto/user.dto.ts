import { UserRole, UserStatus } from "src/entities/user.entity";

export interface QueryUserDto {
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export interface UserDataBaseDto {
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  id?: number;
  created_dt?: Date;
  updated_dt?: Date;
  last_login_time?: Date;
}