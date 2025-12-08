import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { RoleMenu } from '../../entities/role-menu.entity';
import { Menu } from '../../entities/menu.entity';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleMenuService } from './role-menu.service';
import { RoleMenuController } from './role-menu.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, RoleMenu, Menu]), AuthModule],
  controllers: [RoleController, RoleMenuController],
  providers: [RoleService, RoleMenuService],
  exports: [RoleService, RoleMenuService],
})
export class RoleModule {}