import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Menu } from '../../entities/menu.entity';
import { RoleMenu } from '../../entities/role-menu.entity';

@Injectable()
export class RoleMenuService {
  constructor(
    @InjectRepository(RoleMenu)
    private roleMenuRepository: Repository<RoleMenu>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  /**
   * 获取角色的菜单列表
   * @param roleId 角色ID
   * @returns 菜单列表
   */
  async getRoleMenus(roleId: number) {
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId },
      relations: ['menu'],
    });

    return roleMenus.map(rm => rm.menu);
  }

  /**
   * 获取角色的菜单ID列表
   * @param roleId 角色ID
   * @returns 菜单ID数组
   */
  async getRoleMenuIds(roleId: number): Promise<number[]> {
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId },
    });

    return roleMenus.map(rm => rm.menuId);
  }

  /**
   * 获取角色的菜单树
   * @param roleId 角色ID
   * @returns 菜单树
   */
  async getRoleMenuTree(roleId: number) {
    const menus = await this.getRoleMenus(roleId);
    return this.buildMenuTree(menus);
  }

  /**
   * 分配菜单给角色
   * @param roleId 角色ID
   * @param menuIds 菜单ID数组
   */
  async assignMenusToRole(roleId: number, menuIds: number[]) {
    // 检查角色是否存在
    const role = await this.roleMenuRepository.manager.findOne(Role, {
      where: { roleId, delFlag: '0' },
    });

    if (!role) {
      throw new UnauthorizedException('角色不存在');
    }

    // 检查所有菜单是否存在
    if (menuIds && menuIds.length > 0) {
      const menus = await this.menuRepository.find({
        where: {
          menuId: In(menuIds),
          status: '0', // 只查询正常状态的菜单
        },
      });

      if (menus.length !== menuIds.length) {
        throw new UnauthorizedException('部分菜单不存在或已停用');
      }

      // 获取所有菜单的父级菜单ID
      const allMenuIds = new Set<number>();

      for (const menuId of menuIds) {
        allMenuIds.add(menuId);
        // 递归查找父级菜单
        await this.findParentMenus(menuId, allMenuIds);
      }
    }

    // 先删除角色现有的所有菜单
    await this.roleMenuRepository.delete({ roleId });

    // 如果有要分配的菜单，则创建新的关联
    if (menuIds && menuIds.length > 0) {
      const roleMenus = menuIds.map(menuId => ({
        roleId,
        menuId,
      }));

      await this.roleMenuRepository.save(roleMenus);
    }

    return { success: true };
  }

  /**
   * 递归查找父级菜单
   * @param menuId 菜单ID
   * @param menuIds 收集所有菜单ID的Set
   */
  private async findParentMenus(menuId: number, menuIds: Set<number>): Promise<void> {
    const menu = await this.menuRepository.findOne({
      where: { menuId },
    });

    if (menu && menu.parentId && menu.parentId !== 0) {
      menuIds.add(menu.parentId);
      await this.findParentMenus(menu.parentId, menuIds);
    }
  }

  /**
   * 获取菜单的角色列表
   * @param menuId 菜单ID
   * @returns 角色列表
   */
  async getMenuRoles(menuId: number) {
    const roleMenus = await this.roleMenuRepository.find({
      where: { menuId },
      relations: ['role'],
    });

    return roleMenus.map(rm => rm.role);
  }

  /**
   * 批量分配菜单给角色
   * @param roleIds 角色ID数组
   * @param menuId 菜单ID
   */
  async assignMenuToRoles(roleIds: number[], menuId: number) {
    // 检查菜单是否存在
    const menu = await this.menuRepository.findOne({
      where: {
        menuId,
        status: '0',
      },
    });

    if (!menu) {
      throw new UnauthorizedException('菜单不存在或已停用');
    }

    // 为每个角色创建菜单关联（忽略已存在的）
    for (const roleId of roleIds) {
      const existing = await this.roleMenuRepository.findOne({
        where: { roleId, menuId },
      });

      if (!existing) {
        await this.roleMenuRepository.save({
          roleId,
          menuId,
        });
      }
    }

    return { success: true };
  }

  /**
   * 取消角色的菜单
   * @param roleId 角色ID
   * @param menuId 菜单ID
   */
  async removeMenuFromRole(roleId: number, menuId: number) {
    const result = await this.roleMenuRepository.delete({
      roleId,
      menuId,
    });

    if (result.affected === 0) {
      throw new UnauthorizedException('角色菜单关系不存在');
    }

    return { success: true };
  }

  /**
   * 取消角色的所有菜单
   * @param roleId 角色ID
   */
  async removeAllMenusFromRole(roleId: number) {
    await this.roleMenuRepository.delete({ roleId });
    return { success: true };
  }

  /**
   * 批量取消角色的多个菜单
   * @param roleId 角色ID
   * @param menuIds 菜单ID数组
   */
  async removeMenusFromRole(roleId: number, menuIds: number[]) {
    await this.roleMenuRepository.delete({
      roleId,
      menuId: In(menuIds),
    });

    return { success: true };
  }

  /**
   * 构建菜单树
   * @param menus 菜单列表
   * @param parentId 父级ID
   * @returns 菜单树
   */
  private buildMenuTree(menus: Menu[], parentId: number | null = 0): Menu[] {
    return menus
      .filter(menu => menu.parentId === parentId)
      .map(menu => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.menuId),
      }));
  }

  /**
   * 检查角色是否拥有指定菜单
   * @param roleId 角色ID
   * @param menuId 菜单ID
   * @returns 是否拥有菜单
   */
  async hasMenu(roleId: number, menuId: number): Promise<boolean> {
    const count = await this.roleMenuRepository.count({
      where: { roleId, menuId },
    });

    return count > 0;
  }
}