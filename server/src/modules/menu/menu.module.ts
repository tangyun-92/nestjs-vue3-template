import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Menu } from "src/entities/menu.entity";
import { User } from "src/entities/user.entity";
import { UserRole } from "src/entities/user-role.entity";
import { RoleMenu } from "src/entities/role-menu.entity";
import { Role } from "src/entities/role.entity";
import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";
import { AuthModule } from "../auth/auth.module";


@Module({
  imports: [TypeOrmModule.forFeature([Menu, User, UserRole, RoleMenu, Role]), AuthModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})

export class MenuModule {

}