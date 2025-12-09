import { Injectable, UnauthorizedException, Inject, forwardRef } from "@nestjs/common";
import { UserDataBaseDto } from "../user/dto/user.dto";
import { Repository } from "typeorm";
import { User } from "src/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { GlobalStatus } from "src/types/global.types";
import { UserRoleService } from "../user/user-role.service";
import { RoleMenuService } from "../role/role-menu.service";
import { MenuService } from "../menu/menu.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly userRoleService: UserRoleService,
    private readonly roleMenuService: RoleMenuService,
    private readonly menuService: MenuService,
  ) {}

  /**
   * 验证用户
   * @param userName 用户名
   * @param password 密码
   * @returns 用户信息
   */
  async validateUser(
    userName: string,
    password: string,
  ): Promise<UserDataBaseDto | null> {
    const user = await this.userRepository.findOne({ where: { userName: userName } });
    if (!user) {
      return null;
    }

    // 检查用户状态
    if (user.status !== GlobalStatus.ACTIVE) {
      throw new UnauthorizedException('用户被禁用');
    }

    // 验证密码
    if (await bcrypt.compare(password, user.password)) {
      // 更新最后登录时间
      await this.userRepository.update(user.userId, {
        loginDate: new Date(),
      });

      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * 登录
   * @param user 用户信息
   * @returns 登录信息
   */
  async login(user: UserDataBaseDto) {
    const payload = {
      userName: user.userName,
      sub: user.userId,
      nickName: user.nickName,
      status: user.status,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.userId,
        userName: user.userName,
        nickName: user.nickName,
        status: user.status,
        loginDate: user.loginDate,
      },
    };
  }

  /**
   * 获取用户信息
   * @param user 用户信息
   * @returns 用户详细信息
   */
  async getUserInfo(user: any) {
    const userId = user.userId;

    // 获取用户的角色列表
    const roles = await this.userRoleService.getUserRoles(userId);

    // 获取用户角色键名数组
    const roleKeys = await this.userRoleService.getUserRoleKeys(userId);

    // 检查是否是超级管理员
    const isSuperAdmin = roleKeys.includes('superadmin');

    // 如果是超级管理员，直接返回所有权限
    let permissions: string[] = [];
    if (isSuperAdmin) {
      permissions = ['*:*:*'];
    } else {
      // 获取角色的菜单权限
      const permissionSet = new Set<string>();

      for (const role of roles) {
        // 获取角色的所有菜单
        const roleMenus = await this.roleMenuService.getRoleMenus(role.roleId);

        for (const menu of roleMenus) {
          // 递归获取所有权限（包括子菜单的权限）
          await this.getMenuPermissions(menu.menuId, permissionSet);
        }
      }

      // 将Set转换为数组并排序
      permissions = Array.from(permissionSet).sort((a, b) => {
        // 按照模块:操作类型排序
        const aParts = a.split(':');
        const bParts = b.split(':');

        // 先按模块名排序
        if (aParts[0] !== bParts[0]) {
          return aParts[0].localeCompare(bParts[0]);
        }

        // 再按功能排序
        if (aParts[1] !== bParts[1]) {
          return aParts[1].localeCompare(bParts[1]);
        }

        // 最后按操作类型排序 (add, edit, remove, list, query, export)
        const operationOrder = ['add', 'edit', 'remove', 'list', 'query', 'export'];
        const aOrderIndex = operationOrder.indexOf(aParts[2]);
        const bOrderIndex = operationOrder.indexOf(bParts[2]);

        if (aOrderIndex !== -1 && bOrderIndex !== -1) {
          return aOrderIndex - bOrderIndex;
        }

        return aParts[2].localeCompare(bParts[2]);
      });
    }

    // 获取角色信息数组
    const roleInfo = roles.map(role => ({
      ...role,
      flag: false, // 默认标志
      superAdmin: role.roleKey === 'superadmin' // 是否为超级管理员
    }));

    // 构建返回数据
    return {
      user: {
        ...user,
        deptName: null, // TODO: 需要从部门表获取部门名称
        roles: roleInfo,
        roleIds: roles.map(r => r.roleId),
        postIds: null, // TODO: 尚未实现岗位功能
        roleId: roles.length > 0 ? roles[0].roleId : null
      },
      permissions: permissions,
      roles: roleKeys
    };
  }

  /**
   * 递归获取菜单的所有权限（包括子菜单）
   * @param menuId 菜单ID
   * @param permissionSet 权限集合，用于避免重复
   */
  private async getMenuPermissions(menuId: number, permissionSet: Set<string>): Promise<void> {
    const menu = await this.menuService.findOne(menuId);
    if (!menu) {
      return;
    }

    // 添加当前菜单的权限（如果有权限标识）
    if (menu.perms) {
      const perms = menu.perms.split(',');
      perms.forEach(perm => {
        const trimmedPerm = perm.trim();
        if (trimmedPerm) {
          permissionSet.add(trimmedPerm);
        }
      });
    }

    // 如果是目录类型，递归获取子菜单权限
    if (menu.menuType === 'M') {
      const children = await this.menuService.getChildren(menuId);
      for (const child of children) {
        await this.getMenuPermissions(child.menuId, permissionSet);
      }
    }
  }
}