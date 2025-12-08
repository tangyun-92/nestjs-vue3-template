import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/user-role')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  /**
   * 获取用户的角色列表
   * @param userId 用户ID
   * @returns 角色列表
   */
  @Get('user/:userId/roles')
  async getUserRoles(@Param('userId') userId: number) {
    const roles = await this.userRoleService.getUserRoles(+userId);
    return ResponseWrapper.success(roles, '查询成功');
  }

  /**
   * 分配角色给用户
   * @param body 分配请求体
   * @returns 分配结果
   */
  @Post('user/:userId/roles')
  async assignRolesToUser(
    @Param('userId') userId: number,
    @Body() body: { roleIds: number[] }
  ) {
    await this.userRoleService.assignRolesToUser(+userId, body.roleIds);
    return ResponseWrapper.success(null, '分配成功');
  }

  /**
   * 取消用户的角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 取消结果
   */
  @Delete('user/:userId/role/:roleId')
  async removeRoleFromUser(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number
  ) {
    await this.userRoleService.removeRoleFromUser(+userId, +roleId);
    return ResponseWrapper.success(null, '取消成功');
  }

  /**
   * 获取角色的用户列表
   * @param roleId 角色ID
   * @returns 用户列表
   */
  @Get('role/:roleId/users')
  async getRoleUsers(@Param('roleId') roleId: number) {
    const users = await this.userRoleService.getRoleUsers(+roleId);
    return ResponseWrapper.success(users, '查询成功');
  }

  /**
   * 批量分配角色给用户
   * @param body 批量分配请求体
   * @returns 分配结果
   */
  @Post('role/:roleId/users')
  async assignRoleToUsers(
    @Param('roleId') roleId: number,
    @Body() body: { userIds: number[] }
  ) {
    await this.userRoleService.assignRoleToUsers(body.userIds, +roleId);
    return ResponseWrapper.success(null, '分配成功');
  }

  /**
   * 取消用户的所有角色
   * @param userId 用户ID
   * @returns 取消结果
   */
  @Delete('user/:userId/roles')
  async removeAllRolesFromUser(@Param('userId') userId: number) {
    await this.userRoleService.removeAllRolesFromUser(+userId);
    return ResponseWrapper.success(null, '取消成功');
  }

  /**
   * 批量取消用户的多个角色
   * @param userId 用户ID
   * @param body 角色ID数组
   * @returns 取消结果
   */
  @Delete('user/:userId/roles/batch')
  async removeRolesFromUser(
    @Param('userId') userId: number,
    @Body() body: { roleIds: number[] }
  ) {
    await this.userRoleService.removeRolesFromUser(+userId, body.roleIds);
    return ResponseWrapper.success(null, '取消成功');
  }
}