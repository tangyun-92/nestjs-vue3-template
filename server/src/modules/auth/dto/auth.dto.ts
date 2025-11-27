import { UserRole } from "src/entities/user.entity";

export class LoginDto {
  username: string;
  password: string;
}

export class RegisterDto {
  username: string;
  password: string;
  role?: UserRole;
}