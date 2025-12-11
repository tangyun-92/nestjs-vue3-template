import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/user.entity";
import { UserRole } from "src/entities/user-role.entity";
import { UserPost } from "src/entities/user-post.entity";
import { Role } from "src/entities/role.entity";
import { Post } from "src/entities/post.entity";
import { Dept } from "src/entities/dept.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRoleService } from "./user-role.service";
import { UserPostService } from "./user-post.service";
import { UserRoleController } from "./user-role.controller";
import { UserPostController } from "./user-post.controller";
import { AuthModule } from "../auth/auth.module";
import { DeptModule } from "../dept/dept.module";
import { DictModule } from "../dict/dict.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, UserPost, Role, Post, Dept]), AuthModule, DeptModule, DictModule],
  controllers: [UserController, UserRoleController, UserPostController],
  providers: [UserService, UserRoleService, UserPostService],
  exports: [UserService, UserRoleService, UserPostService],
})
export class UserModule {}