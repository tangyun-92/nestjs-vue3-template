import { BadRequestException, Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Inject, Request, UnauthorizedException, Res, Headers } from "@nestjs/common";
import type {
  CreateUserDto,
  QueryUserDto,
  UserDataBaseDto,
  UpdateUserDto,
  UpdatePasswordDto,
  ResetPasswordDto,
  ChangeStatusDto,
  AssignRoleDto
} from "./dto/user.dto";
import { UserService } from "./user.service";
import { DeptService } from "../dept/dept.service";
import { ResponseWrapper } from "src/common/response.wrapper";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type{ Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('system/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly deptService: DeptService,
  ) {}

  /**
   * 查询用户列表
   * @param query 查询参数
   * @returns 用户列表
   */
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.userService.findAll(query);
    return ResponseWrapper.successWithPagination(
      result.users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }),
      result.total,
      query.page || 1,
      query.pageSize || 10,
      '获取用户列表成功',
    );
  }

  /**
   * 获取用户详情
   * @param userId 用户ID
   * @returns 用户详情
   */
  @Get(':userId')
  async findOne(@Param('userId') userId: number) {
    const userData = await this.userService.findOne(userId);
    // 直接返回 userData，因为它已经是正确的结构
    return ResponseWrapper.success(userData, '查询成功');
  }

  /**
   * 获取所有角色
   * @returns 角色详情
   */
  @Get('role/allRoleList')
  async allRoleList() {
    const roles = await this.userService.findAllRoleList();
    return ResponseWrapper.success(roles, '获取角色列表成功');
  }

  /**
   * 获取用户选项列表
   * @param userIds 用户ID列表
   * @returns 用户列表
   */
  @Get('optionselect')
  async optionSelect(@Query('userIds') userIds: string) {
    const ids = userIds ? userIds.split(',').map((id) => +id) : [];
    const users = await this.userService.findOptionsByIds(ids);
    return ResponseWrapper.success(users, '查询成功');
  }

  /**
   * 导出用户列表
   * @param query 查询参数
   */
  @Post('export')
  async export(
    @Body() query: QueryUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.userService.exportUsers(query);

    // 设置响应头
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=users_${timestamp}.xlsx`,
      'Content-Length': buffer.length.toString(),
    });

    // 返回文件流
    res.send(buffer);
  }

  /**
   * 获取个人信息
   * @param req 请求对象
   * @returns 个人信息
   */
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }
    const userData = await this.userService.findOne(+userId);
    // 从 user.user 中移除密码字段
    const { password, ...userWithoutPassword } = userData.user;
    const result = {
      ...userData,
      user: userWithoutPassword,
    };
    return ResponseWrapper.success(result, '查询成功');
  }

  /**
   * 根据部门查询用户列表
   * @param deptId 部门ID
   * @returns 用户列表
   */
  @Get('list/dept/:deptId')
  async listByDept(@Param('deptId') deptId: number) {
    const users = await this.userService.findByDept(deptId);
    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    return ResponseWrapper.success(usersWithoutPassword, '查询成功');
  }

  /**
   * 获取部门树
   * @returns 部门树形列表
   */
  @Get('/dept/deptTree')
  async deptTree() {
    const deptTree = await this.deptService.getDeptTree();
    return ResponseWrapper.success(deptTree, '查询成功');
  }

  /**
   * 新增用户
   * @param createUserDto 创建用户DTO
   * @returns 创建的用户信息
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    if (
      !createUserDto.userName ||
      !createUserDto.password ||
      !createUserDto.nickName
    ) {
      throw new BadRequestException('用户名、密码、昵称不能为空');
    }

    const user = await this.userService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return ResponseWrapper.success(userWithoutPassword, '创建用户成功');
  }

  /**
   * 修改用户
   * @param updateUserDto 更新用户DTO
   * @returns 更新后的用户信息
   */
  @Put()
  async update(@Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(updateUserDto);
    const { password, ...userWithoutPassword } = user;
    return ResponseWrapper.success(userWithoutPassword, '修改成功');
  }

  /**
   * 修改个人信息
   * @param updateUserDto 更新用户DTO
   * @param req 请求对象
   * @returns 更新后的用户信息
   */
  @Put('profile')
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }
    const updatedUser = await this.userService.update({
      ...updateUserDto,
      userId: +userId,
    });
    const { password, ...userWithoutPassword } = updatedUser;
    return ResponseWrapper.success(userWithoutPassword, '修改成功');
  }

  /**
   * 修改密码
   * @param updatePasswordDto 密码更新DTO
   * @param req 请求对象
   * @returns 操作结果
   */
  @Put('updatePwd')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }
    await this.userService.updatePassword(+userId, updatePasswordDto);
    return ResponseWrapper.success(null, '修改成功');
  }

  /**
   * 重置用户密码
   * @param resetPasswordDto 重置密码DTO
   * @returns 操作结果
   */
  @Put('resetPwd')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.userService.resetPassword(resetPasswordDto);
    return ResponseWrapper.success(null, '重置成功');
  }

  /**
   * 修改用户状态
   * @param changeStatusDto 状态修改DTO
   * @returns 操作结果
   */
  @Put('changeStatus')
  async changeStatus(@Body() changeStatusDto: ChangeStatusDto) {
    await this.userService.changeStatus(changeStatusDto);
    return ResponseWrapper.success(null, '修改成功');
  }

  /**
   * 删除用户
   * @param userId 用户ID（支持批量）
   * @returns 操作结果
   */
  @Delete(':userId')
  async delete(@Param('userId') userId: string) {
    const ids = userId.split(',').map((id) => +id);
    await this.userService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 获取用户授权角色
   * @param userId 用户ID
   * @returns 用户和角色信息
   */
  @Get('authRole/:userId')
  async getAuthRole(@Param('userId') userId: number) {
    const userData = await this.userService.findOne(userId);
    return ResponseWrapper.success(
      {
        user: userData.user,
        roles: userData.roles || [],
      },
      '查询成功',
    );
  }

  /**
   * 保存授权角色
   * @param assignRoleDto 角色分配DTO
   * @returns 操作结果
   */
  @Put('authRole')
  async saveAuthRole(@Body() assignRoleDto: AssignRoleDto) {
    await this.userService.assignRoles(assignRoleDto);
    return ResponseWrapper.success(null, '授权成功');
  }
}