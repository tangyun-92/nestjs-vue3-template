import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, Between } from 'typeorm';
import { DictType } from '../../entities/dict-type.entity';
import { ExcelColumn, exportToExcel } from 'src/utils/excel';

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

    // 处理时间范围查询
    const beginTime = query['params[beginTime]'];
    const endTime = query['params[endTime]'];

    // 添加创建时间范围查询
    if (beginTime) {
      where.createTime = Between(beginTime, endTime);
    }

    if (endTime) {
      where.createTime = Between(beginTime, endTime);
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

  /**
   * 导出字典类型数据 Excel
   * @param query 查询参数
   * @returns Excel buffer
   */
  async exportDictTypes(query: any) {
    const { dictTypes } = await this.findAll({
      ...query,
    });

    // 定义列
    const columns: ExcelColumn[] = [
      { header: '字典ID', key: 'dictId', width: 10 },
      { header: '字典名称', key: 'dictName', width: 20 },
      { header: '字典类型', key: 'dictType', width: 20 },
      { header: '创建时间', key: 'createTime', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    const data = dictTypes.map((dictType) => ({
      dictId: dictType.dictId,
      dictName: dictType.dictName,
      dictType: dictType.dictType,
      createTime: dictType.createTime || '',
      remark: dictType.remark || '',
    }));

    // 按照dictId排序
    data.sort((a, b) => a.dictId - b.dictId);

    // 使用 Excel 工具函数导出
    return exportToExcel(columns, data, {
      sheetName: '字典类型列表',
    });
  }
}