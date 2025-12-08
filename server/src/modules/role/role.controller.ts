import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import type { QueryRoleDto, CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 获取角色分页列表
   * @param query 查询参数
   * @returns 分页列表
   */
  @Get('list')
  async list(@Query() query: QueryRoleDto) {
    const { roles, total } = await this.roleService.findAll(query);
    return ResponseWrapper.successWithPagination(
      roles,
      total,
      query.pageNum || 1,
      query.pageSize || 10,
      '查询成功',
    );
  }

  /**
   * 获取角色列表
   * @returns 角色列表
   */
  @Get()
  async findAll() {
    const roles = await this.roleService.findAllWithoutPagination();
    return ResponseWrapper.success(roles, '查询成功');
  }

  /**
   * 根据角色编号获取详细信息
   * @param roleId 角色ID
   * @returns 角色详细信息
   */
  @Get(':roleId')
  async findOne(@Param('roleId') roleId: number) {
    const role = await this.roleService.findOne(+roleId);
    return ResponseWrapper.success(role, '查询成功');
  }

  /**
   * 新增角色
   * @param createRoleDto 创建角色DTO
   * @returns 创建的角色信息
   */
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.roleService.create(createRoleDto);
    return ResponseWrapper.success(role, '新增成功');
  }

  /**
   * 修改角色
   * @param updateRoleDto 更新角色DTO
   * @returns 更新结果
   */
  @Put()
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.roleService.update(updateRoleDto);
    return ResponseWrapper.success(role, '修改成功');
  }

  /**
   * 修改角色状态
   * @param roleId 角色ID
   * @param status 状态
   * @returns 更新结果
   */
  @Put('changeStatus')
  async changeStatus(
    @Body() body: { roleId: number; status: string }
  ) {
    return await this.roleService.updateStatus(body.roleId, body.status);
  }

  /**
   * 删除角色
   * @param roleIds 角色ID数组
   * @returns 删除结果
   */
  @Delete(':roleIds')
  async delete(@Param('roleIds') roleIds: string) {
    const ids = roleIds.split(',').map(id => +id);
    await this.roleService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 分配数据权限
   * @param body 分配权限请求体
   * @returns 分配结果
   */
  @Put('dataScope')
  async dataScope(
    @Body() body: { roleId: number; dataScope: string; deptIds: number[] }
  ) {
    return await this.roleService.dataScope(body.roleId, body.dataScope, body.deptIds);
  }

  /**
   * 导出角色
   * @param query 查询参数
   * @returns 导出的角色数据
   */
  @Post('export')
  async export(@Body() query: QueryRoleDto) {
    const roles = await this.roleService.export(query);
    return ResponseWrapper.success(roles, '导出成功');
  }
}