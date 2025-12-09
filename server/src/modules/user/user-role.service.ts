import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 获取用户的角色列表
   * @param userId 用户ID
   * @returns 角色列表
   */
  async getUserRoles(userId: number) {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map(ur => ur.role);
  }

  /**
   * 分配角色给用户
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   */
  async assignRolesToUser(userId: number, roleIds: number[]) {
    // 检查用户是否存在
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查所有角色是否存在
    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: {
          roleId: In(roleIds),
          delFlag: '0',
          status: '0',
        },
      });

      if (roles.length !== roleIds.length) {
        throw new UnauthorizedException('部分角色不存在或已停用');
      }
    }

    // 先删除用户现有的所有角色
    await this.userRoleRepository.delete({ userId });

    // 如果有要分配的角色，则创建新的关联
    if (roleIds && roleIds.length > 0) {
      const userRoles = roleIds.map(roleId => ({
        userId,
        roleId,
      }));

      await this.userRoleRepository.save(userRoles);
    }

    return { success: true };
  }

  /**
   * 获取角色的用户列表
   * @param roleId 角色ID
   * @returns 用户列表
   */
  async getRoleUsers(roleId: number) {
    const userRoles = await this.userRoleRepository.find({
      where: { roleId },
      relations: ['user'],
    });

    return userRoles.map(ur => ur.user);
  }

  /**
   * 批量分配角色给用户
   * @param userIds 用户ID数组
   * @param roleId 角色ID
   */
  async assignRoleToUsers(userIds: number[], roleId: number) {
    // 检查角色是否存在
    const role = await this.roleRepository.findOne({
      where: {
        roleId,
        delFlag: '0',
        status: '0',
      },
    });

    if (!role) {
      throw new UnauthorizedException('角色不存在或已停用');
    }

    // 检查所有用户是否存在
    const users = await this.userRepository.find({
      where: {
        userId: In(userIds),
        delFlag: '0',
        status: '0',
      },
    });

    if (users.length !== userIds.length) {
      throw new UnauthorizedException('部分用户不存在或已停用');
    }

    // 为每个用户创建角色关联（忽略已存在的）
    for (const userId of userIds) {
      const existing = await this.userRoleRepository.findOne({
        where: { userId, roleId },
      });

      if (!existing) {
        await this.userRoleRepository.save({
          userId,
          roleId,
        });
      }
    }

    return { success: true };
  }

  /**
   * 取消用户的角色
   * @param userId 用户ID
   * @param roleId 角色ID
   */
  async removeRoleFromUser(userId: number, roleId: number) {
    const result = await this.userRoleRepository.delete({
      userId,
      roleId,
    });

    if (result.affected === 0) {
      throw new UnauthorizedException('用户角色关系不存在');
    }

    return { success: true };
  }

  /**
   * 取消用户的所有角色
   * @param userId 用户ID
   */
  async removeAllRolesFromUser(userId: number) {
    await this.userRoleRepository.delete({ userId });
    return { success: true };
  }

  /**
   * 批量取消用户的多个角色
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   */
  async removeRolesFromUser(userId: number, roleIds: number[]) {
    await this.userRoleRepository.delete({
      userId,
      roleId: In(roleIds),
    });

    return { success: true };
  }

  /**
   * 检查用户是否拥有指定角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 是否拥有角色
   */
  async hasRole(userId: number, roleId: number): Promise<boolean> {
    const count = await this.userRoleRepository.count({
      where: { userId, roleId },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有指定角色键名
   * @param userId 用户ID
   * @param roleKey 角色键名
   * @returns 是否拥有角色
   */
  async hasRoleByKey(userId: number, roleKey: string): Promise<boolean> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.some(ur => ur.role.roleKey === roleKey);
  }

  /**
   * 获取用户的角色键名列表
   * @param userId 用户ID
   * @returns 角色键名数组
   */
  async getUserRoleKeys(userId: number): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return userRoles.map(ur => ur.role.roleKey);
  }
}