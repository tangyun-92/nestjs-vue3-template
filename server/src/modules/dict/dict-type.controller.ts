import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { DictTypeService } from './dict-type.service';
import { DictDataService } from './dict-data.service';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/dict/type')
export class DictTypeController {
  constructor(
    private readonly dictTypeService: DictTypeService,
    private readonly dictDataService: DictDataService,
  ) {}

  /**
   * 查询字典类型列表
   * @param query 查询参数
   * @returns 分页字典类型列表
   */
  @Get('list')
  async list(@Query() query: any) {
    const { dictTypes, total, pageNum, pageSize } = await this.dictTypeService.findAll(query);
    return ResponseWrapper.successWithPagination(
      dictTypes,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 查询字典类型详细
   * @param dictId 字典ID
   * @returns 字典类型详情
   */
  @Get(':dictId')
  async getType(@Param('dictId') dictId: number) {
    const dictType = await this.dictTypeService.findOne(+dictId);
    return ResponseWrapper.success(dictType, '查询成功');
  }

  /**
   * 新增字典类型
   * @param data 字典类型数据
   * @returns 创建的字典类型
   */
  @Post()
  async addType(@Body() data: any) {
    const dictType = await this.dictTypeService.create(data);
    return ResponseWrapper.success(dictType, '新增成功');
  }

  /**
   * 修改字典类型
   * @param data 字典类型数据
   * @returns 更新的字典类型
   */
  @Put()
  async updateType(@Body() data: any) {
    const dictType = await this.dictTypeService.update(data);
    return ResponseWrapper.success(dictType, '修改成功');
  }

  /**
   * 删除字典类型
   * @param dictId 字典ID（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':dictId')
  async delType(@Param('dictId') dictId: string) {
    const ids = dictId.split(',').map(id => +id);
    await this.dictTypeService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 刷新字典缓存
   * @returns 刷新结果
   */
  @Delete('refreshCache')
  async refreshCache() {
    const result = await this.dictTypeService.refreshCache();
    return ResponseWrapper.success(result, '刷新成功');
  }

  /**
   * 获取字典选择框列表
   * @returns 字典类型列表
   */
  @Get('optionselect')
  async optionselect() {
    const dictTypes = await this.dictTypeService.findOptionSelect();
    return ResponseWrapper.success(dictTypes, '查询成功');
  }
}