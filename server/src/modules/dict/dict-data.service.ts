import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DictData } from '../../entities/dict-data.entity';
import { DictType } from '../../entities/dict-type.entity';
import { ExcelColumn, exportToExcel } from 'src/utils/excel';

@Injectable()
export class DictDataService {
  constructor(
    @InjectRepository(DictData)
    private dictDataRepository: Repository<DictData>,
    @InjectRepository(DictType)
    private dictTypeRepository: Repository<DictType>,
  ) {}

  /**
   * 查询字典数据列表
   * @param query 查询参数
   * @returns 字典数据列表
   */
  async findAll(query: any) {
    const {
      pageNum = 1,
      pageSize = 10,
      dictType,
      dictLabel,
      dictName,
    } = query;

    const where: any = {};

    if (dictType) {
      where.dictType = dictType;
    }

    if (dictLabel) {
      where.dictLabel = Like(`%${dictLabel}%`);
    }

    // 如果传了字典名称，需要先查询字典类型
    if (dictName) {
      const dictTypeEntity = await this.dictTypeRepository.findOne({
        where: { dictName: Like(`%${dictName}%`) }
      });
      if (dictTypeEntity) {
        where.dictType = dictTypeEntity.dictType;
      } else {
        // 如果没找到字典类型，返回空结果
        return {
          dictDataList: [],
          total: 0,
          pageNum,
          pageSize,
        };
      }
    }

    const [dictDataList, total] = await this.dictDataRepository.findAndCount({
      where,
      order: {
        dictSort: 'ASC'
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return {
      dictDataList: dictDataList.map(data => ({
        ...data,
        createTime: data.createTime?.toISOString(),
        updateTime: data.updateTime?.toISOString(),
      })),
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 根据字典编码查询字典数据详细
   * @param dictCode 字典编码
   * @returns 字典数据详情
   */
  async findOne(dictCode: number) {
    const dictData = await this.dictDataRepository.findOne({
      where: { dictCode }
    });

    if (!dictData) {
      throw new UnauthorizedException('字典数据不存在');
    }

    return {
      ...dictData,
      createTime: dictData.createTime?.toISOString(),
      updateTime: dictData.updateTime?.toISOString(),
    };
  }

  /**
   * 根据字典类型查询字典数据信息
   * @param dictType 字典类型
   * @returns 字典数据列表
   */
  async findByDictType(dictType: string) {
    // 先检查字典类型是否存在
    const dictTypeEntity = await this.dictTypeRepository.findOne({
      where: { dictType }
    });

    if (!dictTypeEntity) {
      throw new UnauthorizedException('字典类型不存在');
    }

    const dictDataList = await this.dictDataRepository.find({
      where: { dictType },
      order: {
        dictSort: 'ASC'
      }
    });

    return dictDataList.map(data => ({
      ...data,
      createTime: data.createTime?.toISOString(),
      updateTime: data.updateTime?.toISOString(),
    }));
  }

  /**
   * 新增字典数据
   * @param data 字典数据
   * @returns 创建的字典数据
   */
  async create(data: any) {
    // 检查字典类型是否存在
    const dictType = await this.dictTypeRepository.findOne({
      where: { dictType: data.dictType }
    });

    if (!dictType) {
      throw new UnauthorizedException('字典类型不存在');
    }

    const dictData = this.dictDataRepository.create(data);
    const savedData = await this.dictDataRepository.save(dictData);

    // save 方法可能返回数组或单个对象，处理两种情况
    const result = Array.isArray(savedData) ? savedData[0] : savedData;

    return {
      ...result,
      createTime: result.createTime?.toISOString(),
      updateTime: result.updateTime?.toISOString(),
    };
  }

  /**
   * 修改字典数据
   * @param data 字典数据
   * @returns 更新的字典数据
   */
  async update(data: any) {
    const dictData = await this.dictDataRepository.findOne({
      where: { dictCode: data.dictCode }
    });

    if (!dictData) {
      throw new UnauthorizedException('字典数据不存在');
    }

    // 如果更新了字典类型，检查新类型是否存在
    if (data.dictType && data.dictType !== dictData.dictType) {
      const dictType = await this.dictTypeRepository.findOne({
        where: { dictType: data.dictType }
      });

      if (!dictType) {
        throw new UnauthorizedException('字典类型不存在');
      }
    }

    await this.dictDataRepository.update(data.dictCode, data);

    const updatedData = await this.dictDataRepository.findOne({
      where: { dictCode: data.dictCode }
    });

    if (!updatedData) {
      throw new UnauthorizedException('更新失败，字典数据不存在');
    }

    return {
      ...updatedData,
      createTime: updatedData.createTime?.toISOString(),
      updateTime: updatedData.updateTime?.toISOString(),
    };
  }

  /**
   * 删除字典数据
   * @param dictCodes 字典编码数组
   */
  async delete(dictCodes: number[]) {
    for (const dictCode of dictCodes) {
      const dictData = await this.dictDataRepository.findOne({
        where: { dictCode }
      });

      if (!dictData) {
        throw new UnauthorizedException('字典数据不存在');
      }
    }

    await this.dictDataRepository.delete(dictCodes);
  }

  /**
   * 导出字典数据 Excel
   * @param query 查询参数
   * @returns Excel buffer
   */
  async exportDictData(query: any) {
    const { dictDataList } = await this.findAll({
      ...query,
    });

    // 定义列
    const columns: ExcelColumn[] = [
      { header: '字典编码', key: 'dictCode', width: 10 },
      { header: '字典标签', key: 'dictLabel', width: 20 },
      { header: '字典键值', key: 'dictValue', width: 15 },
      { header: '字典类型', key: 'dictType', width: 20 },
      { header: '字典排序', key: 'dictSort', width: 10 },
      { header: '是否默认', key: 'isDefault', width: 10 },
      { header: '样式属性', key: 'cssClass', width: 15 },
      { header: '表格样式', key: 'listClass', width: 15 },
      { header: '创建时间', key: 'createTime', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    const data = dictDataList.map((dictData) => ({
      dictCode: dictData.dictCode,
      dictLabel: dictData.dictLabel,
      dictValue: dictData.dictValue,
      dictType: dictData.dictType,
      dictSort: dictData.dictSort,
      isDefault: dictData.isDefault === 'Y' ? '是' : '否',
      cssClass: dictData.cssClass || '',
      listClass: dictData.listClass || '',
      createTime: dictData.createTime || '',
      remark: dictData.remark || '',
    }));

    // 按照dictCode排序
    data.sort((a, b) => a.dictCode - b.dictCode);

    // 使用 Excel 工具函数导出
    return exportToExcel(columns, data, {
      sheetName: '字典数据列表',
    });
  }
}