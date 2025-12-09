import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DictDataService } from './dict-data.service';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/dict/data')
export class DictDataController {
  constructor(private readonly dictDataService: DictDataService) {}

  /**
   * 查询字典数据列表
   * @param query 查询参数
   * @returns 分页字典数据列表
   */
  @Get('list')
  async list(@Query() query: any) {
    const { dictDataList, total, pageNum, pageSize } = await this.dictDataService.findAll(query);
    return ResponseWrapper.successWithPagination(
      dictDataList,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 查询字典数据详细
   * @param dictCode 字典编码
   * @returns 字典数据详情
   */
  @Get(':dictCode')
  async getData(@Param('dictCode') dictCode: number) {
    const dictData = await this.dictDataService.findOne(+dictCode);
    return ResponseWrapper.success(dictData, '查询成功');
  }

  /**
   * 新增字典数据
   * @param data 字典数据
   * @returns 创建的字典数据
   */
  @Post()
  async addData(@Body() data: any) {
    const dictData = await this.dictDataService.create(data);
    return ResponseWrapper.success(dictData, '新增成功');
  }

  /**
   * 修改字典数据
   * @param data 字典数据
   * @returns 更新的字典数据
   */
  @Put()
  async updateData(@Body() data: any) {
    const dictData = await this.dictDataService.update(data);
    return ResponseWrapper.success(dictData, '修改成功');
  }

  /**
   * 删除字典数据
   * @param dictCode 字典编码（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':dictCode')
  async delData(@Param('dictCode') dictCode: string) {
    const codes = dictCode.split(',').map(code => +code);
    await this.dictDataService.delete(codes);
    return ResponseWrapper.success(null, '删除成功');
  }
}