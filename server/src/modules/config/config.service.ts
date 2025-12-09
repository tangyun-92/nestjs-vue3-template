import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In, LessThanOrEqual } from 'typeorm';
import { Config } from '../../entities/config.entity';
import { QueryConfigDto, CreateConfigDto, UpdateConfigDto } from './dto/config.dto';
import { ResponseWrapper } from '../../common/response.wrapper';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {}

  /**
   * 分页查询参数配置
   * @param query 查询参数
   * @returns 参数配置列表
   */
  async findAll(query: QueryConfigDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      configName,
      configKey,
      configType,
    } = query;

    const where: any = {};

    if (configName) {
      where.configName = Like(`%${configName}%`);
    }

    if (configKey) {
      where.configKey = Like(`%${configKey}%`);
    }

    if (configType) {
      where.configType = configType;
    }

    const beginTime = query['params[beginTime]'];
    const endTime = query['params[endTime]'];
    if (beginTime && endTime) {
      where.createTime = Between(
        new Date(beginTime),
        new Date(endTime),
      );
    }

    const [configs, total] = await this.configRepository.findAndCount({
      where,
      order: {
        createTime: 'DESC',
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return { configs, total };
  }

  /**
   * 根据参数键名查询参数值
   * @param configKey 参数键名
   * @returns 参数值
   */
  async getConfigByKey(configKey: string) {
    const config = await this.configRepository.findOne({
      where: { configKey },
    });

    return config?.configValue || null;
  }

  /**
   * 根据参数ID查询参数信息
   * @param configId 参数ID
   * @returns 参数信息
   */
  async findOne(configId: number) {
    const config = await this.configRepository.findOne({
      where: { configId },
    });

    if (!config) {
      throw new UnauthorizedException('参数配置不存在');
    }

    return config;
  }

  /**
   * 新增参数配置
   * @param createConfigDto 创建参数配置DTO
   * @returns 创建的配置信息
   */
  async create(createConfigDto: CreateConfigDto) {
    // 检查参数键名是否已存在
    const existConfig = await this.configRepository.findOne({
      where: { configKey: createConfigDto.configKey },
    });

    if (existConfig) {
      throw new UnauthorizedException('参数键名已存在');
    }

    const config = this.configRepository.create({
      ...createConfigDto,
      configType: createConfigDto.configType || 'N',
      tenantId: '000000', // 默认租户ID
    });

    const savedConfig = await this.configRepository.save(config);
    return savedConfig;
  }

  /**
   * 修改参数配置
   * @param updateConfigDto 更新参数配置DTO
   * @returns 更新后的配置信息
   */
  async update(updateConfigDto: UpdateConfigDto) {
    const { configId } = updateConfigDto;

    // 检查配置是否存在
    const existConfig = await this.configRepository.findOne({
      where: { configId },
    });

    if (!existConfig) {
      throw new UnauthorizedException('参数配置不存在');
    }

    // 如果修改了参数键名，检查新的键名是否已存在
    if (
      updateConfigDto.configKey &&
      updateConfigDto.configKey !== existConfig.configKey
    ) {
      const keyExistConfig = await this.configRepository.findOne({
        where: { configKey: updateConfigDto.configKey },
      });

      if (keyExistConfig) {
        throw new UnauthorizedException('参数键名已存在');
      }
    }

    // 更新配置
    await this.configRepository.update(configId, updateConfigDto);

    // 返回更新后的配置
    const updatedConfig = await this.configRepository.findOne({
      where: { configId },
    });

    return updatedConfig;
  }

  /**
   * 删除参数配置
   * @param configIds 参数ID数组
   */
  async delete(configIds: number[]) {
    // 确保 configIds 是数组
    const ids = Array.isArray(configIds) ? configIds : [configIds];

    // 检查是否存在系统内置参数
    const configs = await this.configRepository.find({
      where: {
        configId: In(ids),
      },
    });

    const systemConfigs = configs.filter((config) => config.configType === 'Y');
    if (systemConfigs.length > 0) {
      throw new UnauthorizedException('系统内置参数不能删除');
    }

    // 执行删除
    const result = await this.configRepository.delete(ids);

    if (result.affected === 0) {
      throw new UnauthorizedException('删除失败，参数不存在');
    }
  }

  /**
   * 刷新参数缓存
   * @returns 刷新结果
   */
  async refreshCache() {
    // TODO: 实现刷新缓存的逻辑
    // 可以结合 Redis 或内存缓存来存储常用配置
    return ResponseWrapper.success(null, '刷新成功');
  }

  /**
   * 导出参数配置
   * @param query 查询参数
   * @returns 导出的配置数据
   */
  async export(query: QueryConfigDto) {
    const { configs } = await this.findAll({
      ...query,
      pageNum: 1,
      pageSize: 9999, // 导出全部数据
    });

    return configs;
  }
}