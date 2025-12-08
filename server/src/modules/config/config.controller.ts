import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import type { QueryConfigDto, CreateConfigDto, UpdateConfigDto } from './dto/config.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取参数配置分页列表
   * @param query 查询参数
   * @returns 分页列表
   */
  @Get('list')
  async list(@Query() query: QueryConfigDto) {
    const { configs, total } = await this.configService.findAll(query);
    return ResponseWrapper.successWithPagination(
      configs.map((config) => {
        const { ...configWithoutPassword } = config;
        return configWithoutPassword;
      }),
      total,
      query.pageNum || 1,
      query.pageSize || 10,
      '查询成功',
    );
  }

  /**
   * 获取参数配置列表
   * @returns 列表
   */
  @Get()
  async findAll() {
    const { configs } = await this.configService.findAll({ pageNum: 1, pageSize: 9999 });
    return ResponseWrapper.success(configs, '查询成功');
  }

  /**
   * 根据参数编号获取详细信息
   * @param configId 参数ID
   * @returns 参数详细信息
   */
  @Get(':configId')
  async findOne(@Param('configId') configId: number) {
    const config = await this.configService.findOne(+configId);
    return ResponseWrapper.success(config, '查询成功');
  }

  /**
   * 根据参数键名查询参数值
   * @param configKey 参数键名
   * @returns 参数值
   */
  @Get('configKey/:configKey')
  async getConfigByKey(@Param('configKey') configKey: string) {
    const configValue = await this.configService.getConfigByKey(configKey);
    if (!configValue) {
      throw new Error('参数键名不存在');
    }
    return ResponseWrapper.success({ configKey, configValue }, '查询成功');
  }

  /**
   * 新增参数配置
   * @param createConfigDto 创建参数配置DTO
   * @returns 创建的配置信息
   */
  @Post()
  async create(@Body() createConfigDto: CreateConfigDto) {
    const config = await this.configService.create(createConfigDto);
    return ResponseWrapper.success(config, '新增成功');
  }

  /**
   * 修改参数配置
   * @param updateConfigDto 更新参数配置DTO
   * @returns 更新结果
   */
  @Put()
  async update(@Body() updateConfigDto: UpdateConfigDto) {
    const config = await this.configService.update(updateConfigDto);
    return ResponseWrapper.success(config, '修改成功');
  }

  /**
   * 删除参数配置
   * @param configIds 参数ID数组
   * @returns 删除结果
   */
  @Delete(':configIds')
  async delete(@Param('configIds') configIds: string) {
    const ids = configIds.split(',').map(id => +id);
    await this.configService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 刷新参数缓存
   * @returns 刷新结果
   */
  @Delete('refreshCache')
  async refreshCache() {
    return await this.configService.refreshCache();
  }

  /**
   * 导出参数配置
   * @param query 查询参数
   * @returns 导出的配置数据
   */
  @Post('export')
  async export(@Body() query: QueryConfigDto) {
    const configs = await this.configService.export(query);
    return ResponseWrapper.success(configs, '导出成功');
  }
}