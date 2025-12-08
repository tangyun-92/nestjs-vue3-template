import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RoleMenuService } from './role-menu.service';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/role-menu')
export class RoleMenuController {
  constructor(private readonly roleMenuService: RoleMenuService) {}

  /**
   * 获取角色的菜单列表
   * @param roleId 角色ID
   * @returns 菜单列表
   */
  @Get('role/:roleId/menus')
  async getRoleMenus(@Param('roleId') roleId: number) {
    const menus = await this.roleMenuService.getRoleMenus(+roleId);
    return ResponseWrapper.success(menus, '查询成功');
  }

  /**
   * 获取角色的菜单树
   * @param roleId 角色ID
   * @returns 菜单树
   */
  @Get('role/:roleId/menuTree')
  async getRoleMenuTree(@Param('roleId') roleId: number) {
    const menuTree = await this.roleMenuService.getRoleMenuTree(+roleId);
    return ResponseWrapper.success(menuTree, '查询成功');
  }

  /**
   * 分配菜单给角色
   * @param body 分配请求体
   * @returns 分配结果
   */
  @Post('role/:roleId/menus')
  async assignMenusToRole(
    @Param('roleId') roleId: number,
    @Body() body: { menuIds: number[] }
  ) {
    await this.roleMenuService.assignMenusToRole(+roleId, body.menuIds);
    return ResponseWrapper.success(null, '分配成功');
  }

  /**
   * 获取菜单的角色列表
   * @param menuId 菜单ID
   * @returns 角色列表
   */
  @Get('menu/:menuId/roles')
  async getMenuRoles(@Param('menuId') menuId: number) {
    const roles = await this.roleMenuService.getMenuRoles(+menuId);
    return ResponseWrapper.success(roles, '查询成功');
  }

  /**
   * 批量分配菜单给角色
   * @param body 批量分配请求体
   * @returns 分配结果
   */
  @Post('menu/:menuId/roles')
  async assignMenuToRoles(
    @Param('menuId') menuId: number,
    @Body() body: { roleIds: number[] }
  ) {
    await this.roleMenuService.assignMenuToRoles(body.roleIds, +menuId);
    return ResponseWrapper.success(null, '分配成功');
  }

  /**
   * 取消角色的菜单
   * @param roleId 角色ID
   * @param menuId 菜单ID
   * @returns 取消结果
   */
  @Delete('role/:roleId/menu/:menuId')
  async removeMenuFromRole(
    @Param('roleId') roleId: number,
    @Param('menuId') menuId: number
  ) {
    await this.roleMenuService.removeMenuFromRole(+roleId, +menuId);
    return ResponseWrapper.success(null, '取消成功');
  }

  /**
   * 取消角色的所有菜单
   * @param roleId 角色ID
   * @returns 取消结果
   */
  @Delete('role/:roleId/menus')
  async removeAllMenusFromRole(@Param('roleId') roleId: number) {
    await this.roleMenuService.removeAllMenusFromRole(+roleId);
    return ResponseWrapper.success(null, '取消成功');
  }

  /**
   * 批量取消角色的多个菜单
   * @param roleId 角色ID
   * @param body 菜单ID数组
   * @returns 取消结果
   */
  @Delete('role/:roleId/menus/batch')
  async removeMenusFromRole(
    @Param('roleId') roleId: number,
    @Body() body: { menuIds: number[] }
  ) {
    await this.roleMenuService.removeMenusFromRole(+roleId, body.menuIds);
    return ResponseWrapper.success(null, '取消成功');
  }
}