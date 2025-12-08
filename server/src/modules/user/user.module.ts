import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { UserRole } from "src/entities/user-role.entity";
import { Role } from "src/entities/role.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRoleService } from "./user-role.service";
import { UserRoleController } from "./user-role.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role]), AuthModule],
  controllers: [UserController, UserRoleController],
  providers: [UserService, UserRoleService],
  exports: [UserService, UserRoleService],
})
export class UserModule {}