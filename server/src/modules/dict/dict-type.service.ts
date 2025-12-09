import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { DictType } from '../../entities/dict-type.entity';

@Injectable()
export class DictTypeService {
  constructor(
    @InjectRepository(DictType)
    private dictTypeRepository: Repository<DictType>,
  ) {}

  /**
   * 查询字典类型列表
   * @param query 查询参数
   * @returns 字典类型列表
   */
  async findAll(query: any) {
    const {
      pageNum = 1,
      pageSize = 10,
      dictName,
      dictType,
    } = query;

    const where: any = {};

    if (dictName) {
      where.dictName = Like(`%${dictName}%`);
    }

    if (dictType) {
      where.dictType = Like(`%${dictType}%`);
    }

    const [dictTypes, total] = await this.dictTypeRepository.findAndCount({
      where,
      order: {
        createTime: 'DESC'
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    console.log(dictTypes);

    return {
      dictTypes: dictTypes.map(type => ({
        ...type,
        dictId: +type.dictId,
        createTime: type.createTime?.toISOString(),
        updateTime: type.updateTime?.toISOString(),
      })),
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 根据ID查询字典类型详情
   * @param dictId 字典ID
   * @returns 字典类型详情
   */
  async findOne(dictId: number) {
    const dictType = await this.dictTypeRepository.findOne({
      where: { dictId }
    });

    if (!dictType) {
      throw new UnauthorizedException('字典类型不存在');
    }

    return {
      ...dictType,
      dictId: +dictType.dictId,
      createTime: dictType.createTime?.toISOString(),
      updateTime: dictType.updateTime?.toISOString(),
    };
  }

  /**
   * 新增字典类型
   * @param data 字典类型数据
   * @returns 创建的字典类型
   */
  async create(data: any) {
    // 检查字典类型是否已存在
    const existType = await this.dictTypeRepository.findOne({
      where: { dictType: data.dictType }
    });

    if (existType) {
      throw new UnauthorizedException('字典类型已存在');
    }

    const dictType = this.dictTypeRepository.create(data);
    const savedType = await this.dictTypeRepository.save(dictType);

    // save 方法可能返回数组或单个对象，处理两种情况
    const result = Array.isArray(savedType) ? savedType[0] : savedType;

    return {
      ...result,
      createTime: result.createTime?.toISOString(),
      updateTime: result.updateTime?.toISOString(),
    };
  }

  /**
   * 修改字典类型
   * @param data 字典类型数据
   * @returns 更新的字典类型
   */
  async update(data: any) {
    const dictType = await this.dictTypeRepository.findOne({
      where: { dictId: data.dictId }
    });

    if (!dictType) {
      throw new UnauthorizedException('字典类型不存在');
    }

    // 检查字典类型是否重复
    if (data.dictType && data.dictType !== dictType.dictType) {
      const existType = await this.dictTypeRepository.findOne({
        where: {
          dictType: data.dictType,
          dictId: Not(data.dictId)
        }
      });

      if (existType) {
        throw new UnauthorizedException('字典类型已存在');
      }
    }

    await this.dictTypeRepository.update(data.dictId, data);

    const updatedType = await this.dictTypeRepository.findOne({
      where: { dictId: data.dictId }
    });

    if (!updatedType) {
      throw new UnauthorizedException('更新失败，字典类型不存在');
    }

    return {
      ...updatedType,
      createTime: updatedType.createTime?.toISOString(),
      updateTime: updatedType.updateTime?.toISOString(),
    };
  }

  /**
   * 删除字典类型
   * @param dictIds 字典ID数组
   */
  async delete(dictIds: number[]) {
    for (const dictId of dictIds) {
      const dictType = await this.dictTypeRepository.findOne({
        where: { dictId }
      });

      if (!dictType) {
        throw new UnauthorizedException('字典类型不存在');
      }
    }

    await this.dictTypeRepository.delete(dictIds);
  }

  /**
   * 获取字典选择框列表
   * @returns 字典类型列表
   */
  async findOptionSelect() {
    const dictTypes = await this.dictTypeRepository.find({
      select: ['dictId', 'dictName', 'dictType'],
      order: {
        dictId: 'DESC'
      }
    });

    return dictTypes;
  }

  /**
   * 刷新字典缓存
   * @returns 操作结果
   */
  async refreshCache() {
    // TODO: 实现缓存刷新逻辑
    return { success: true, message: '刷新成功' };
  }
}