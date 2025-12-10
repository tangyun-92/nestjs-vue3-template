import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { LoginInfo } from "src/entities/login-log.entity";
import { UserRole } from "src/entities/user-role.entity";
import { Role } from "src/entities/role.entity";
import { RoleMenu } from "src/entities/role-menu.entity";
import { Menu } from "src/entities/menu.entity";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { UserRoleService } from "../user/user-role.service";
import { RoleMenuService } from "../role/role-menu.service";
import { MenuService } from "../menu/menu.service";
import { IpLocationService } from "src/common/services/ip-location.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LoginInfo, UserRole, Role, RoleMenu, Menu]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, UserRoleService, RoleMenuService, MenuService, IpLocationService],
  exports: [AuthService, JwtAuthGuard],
})

export class AuthModule {

}