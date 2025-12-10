import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DeptService } from './dept.service';
import type { QueryDeptDto, CreateDeptDto, UpdateDeptDto } from './dto/dept.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /**
   * 查询部门列表
   * @param query 查询参数
   * @returns 部门树形列表
   */
  @Get('list')
  async list(@Query() query: QueryDeptDto) {
    const depts = await this.deptService.findAll(query);
    return ResponseWrapper.success(depts, '查询成功');
  }

  /**
   * 获取部门树（用于用户选择）
   * @returns 部门树形列表
   */
  @Get('deptTree')
  async deptTree() {
    const deptTree = await this.deptService.getDeptTree();
    return ResponseWrapper.success(deptTree, '查询成功');
  }

  /**
   * 通过部门ID查询部门选项
   * @param query 查询参数
   * @returns 部门选项列表
   */
  @Get('optionselect')
  async optionSelect(@Query('deptIds') deptIds: string) {
    const ids = deptIds ? deptIds.split(',').map(id => +id) : [];
    const depts = await this.deptService.findOptionsByIds(ids);
    return ResponseWrapper.success(depts, '查询成功');
  }

  /**
   * 查询部门列表（排除节点）
   * @param deptId 部门ID
   * @returns 部门列表
   */
  @Get('list/exclude/:deptId')
  async listExcludeChild(@Param('deptId') deptId: number) {
    const depts = await this.deptService.findListExcludeChild(+deptId);
    const treeData = this.deptService.buildDeptTreeOptions(depts);
    return ResponseWrapper.success(treeData, '查询成功');
  }

  /**
   * 根据部门编号获取详细信息
   * @param deptId 部门ID
   * @returns 部门详细信息
   */
  @Get(':deptId')
  async findOne(@Param('deptId') deptId: number) {
    const dept = await this.deptService.findOne(+deptId);
    return ResponseWrapper.success(dept, '查询成功');
  }

  /**
   * 新增部门
   * @param createDeptDto 创建部门DTO
   * @returns 创建的部门信息
   */
  @Post()
  async create(@Body() createDeptDto: CreateDeptDto) {
    const dept = await this.deptService.create(createDeptDto);
    return ResponseWrapper.success(dept, '新增成功');
  }

  /**
   * 修改部门
   * @param updateDeptDto 更新部门DTO
   * @returns 更新的部门信息
   */
  @Put()
  async update(@Body() updateDeptDto: UpdateDeptDto) {
    const dept = await this.deptService.update(updateDeptDto);
    return ResponseWrapper.success(dept, '修改成功');
  }

  /**
   * 删除部门
   * @param deptId 部门ID
   * @returns 删除结果
   */
  @Delete(':deptId')
  async delete(@Param('deptId') deptId: string) {
    const ids = deptId.split(',').map(id => +id);
    await this.deptService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }
}