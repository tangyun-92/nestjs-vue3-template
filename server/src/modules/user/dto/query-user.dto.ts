import { UserRole, UserStatus } from "src/entities/user.entity";

export interface QueryUserDto {
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}