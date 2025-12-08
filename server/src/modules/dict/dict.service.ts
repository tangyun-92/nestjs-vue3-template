import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DictData } from 'src/entities/dict-data.entity';
import { formatDate } from 'src/utils/date';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictData)
    private readonly dictDataRepository: Repository<DictData>,
  ) {}

  /**
   * 根据字典类型获取字典数据
   * @param dictType 字典类型
   * @returns 字典数据列表
   */
  async getDictDataByType(dictType: string) {
    const dictDataList = await this.dictDataRepository.find({
      where: { dictType },
      order: { dictSort: 'ASC' },
      select: [
        'dictCode',
        'dictSort',
        'dictLabel',
        'dictValue',
        'dictType',
        'cssClass',
        'listClass',
        'isDefault',
        'remark',
        'createTime',
      ],
    });

    // 格式化返回数据，匹配示例中的格式
    return dictDataList.map((item) => ({
      dictCode: item.dictCode,
      dictSort: item.dictSort,
      dictLabel: item.dictLabel,
      dictValue: item.dictValue,
      dictType: item.dictType,
      cssClass: item.cssClass || '',
      listClass: item.listClass || '',
      isDefault: item.isDefault,
      remark: item.remark || '',
      createTime: item.createTime ? formatDate(item.createTime) : '',
    }));
  }
}
