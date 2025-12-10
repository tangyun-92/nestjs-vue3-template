import { Injectable, UnauthorizedException, Inject, forwardRef } from "@nestjs/common";
import { UserDataBaseDto } from "../user/dto/user.dto";
import { Repository } from "typeorm";
import { User } from "src/entities/user.entity";
import { LoginInfo } from "src/entities/login-log.entity";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { GlobalStatus } from "src/types/global.types";
import { UserRoleService } from "../user/user-role.service";
import { RoleMenuService } from "../role/role-menu.service";
import { MenuService } from "../menu/menu.service";
import { Request } from "express";
import { IpLocationService } from "src/common/services/ip-location.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LoginInfo)
    private loginInfoRepository: Repository<LoginInfo>,
    private jwtService: JwtService,
    private readonly userRoleService: UserRoleService,
    private readonly roleMenuService: RoleMenuService,
    private readonly menuService: MenuService,
    private readonly ipLocationService: IpLocationService,
  ) {}

  /**
   * 验证用户
   * @param userName 用户名
   * @param password 密码
   * @param req 请求对象，用于获取IP等信息
   * @returns 用户信息
   */
  async validateUser(
    userName: string,
    password: string,
    req?: Request,
  ): Promise<UserDataBaseDto | null> {
    const user = await this.userRepository.findOne({ where: { userName: userName } });
    const clientInfo = this.getClientInfo(req);

    // 记录登录失败的辅助函数
    const recordFailure = async (msg: string, throwError?: string) => {
      await this.recordLoginLog({
        userName,
        status: 1, // 失败
        ...clientInfo,
        msg,
      });
      if (throwError) {
        throw new UnauthorizedException(throwError);
      }
    };

    if (!user) {
      await recordFailure('用户名或密码错误');
      return null;
    }

    if (user.status !== GlobalStatus.ACTIVE) {
      await recordFailure('用户已被禁用', '用户被禁用');
    }

    if (await bcrypt.compare(password, user.password)) {
      // 更新最后登录时间
      await this.userRepository.update(user.userId, {
        loginDate: new Date(),
      });

      // 记录登录成功日志
      await this.recordLoginLog({
        userName,
        status: 0, // 成功
        ...clientInfo,
        msg: '登录成功',
      });

      const { password, ...result } = user;
      return result;
    } else {
      await recordFailure('用户名或密码错误');
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

  /**
   * 获取客户端信息
   * @param req 请求对象
   * @returns 客户端信息
   */
  private getClientInfo(req?: Request) {
    const userAgent = req?.headers['user-agent'] || '';

    // 解析浏览器信息
    let browser = '未知';
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
    } else if (userAgent.includes('MSIE')) {
      browser = 'IE';
    }

    // 解析操作系统
    let os = '未知';
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'MacOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS')) {
      os = 'iOS';
    }

    // 获取IP地址
    const ip = req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress || '127.0.0.1';
    const cleanIp = ip.replace(/^::ffff:/, '');

    // 使用IP定位服务查询地理位置
    const loginLocation = this.ipLocationService.getLocationByIp(cleanIp);

    // 判断设备类型
    let deviceType = 'pc';
    let clientKey = 'pc';
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      deviceType = 'mobile';
      clientKey = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceType = 'tablet';
      clientKey = 'tablet';
    }

    return {
      ipaddr: cleanIp,
      loginLocation,
      browser,
      os,
      clientKey,
      deviceType,
    };
  }

  /**
   * 记录登录日志
   * @param loginData 登录数据
   */
  private async recordLoginLog(loginData: {
    userName: string;
    status: number;
    ipaddr: string;
    loginLocation: string;
    browser: string;
    os: string;
    msg: string;
    clientKey: string;
    deviceType: string;
  }) {
    try {
      const loginLog = this.loginInfoRepository.create({
        ...loginData,
        tenantId: '000000', // 默认租户
        loginTime: new Date(),
      });

      await this.loginInfoRepository.save(loginLog);
    } catch (error) {
      console.error('记录登录日志失败:', error);
    }
  }

  /**
   * 记录退出日志
   * @param userName 用户名
   * @param req 请求对象
   */
  async recordLogoutLog(userName: string, req?: Request) {
    const clientInfo = this.getClientInfo(req);

    await this.recordLoginLog({
      userName,
      status: 0, // 退出也算成功
      ...clientInfo,
      msg: '退出成功',
    });
  }
}