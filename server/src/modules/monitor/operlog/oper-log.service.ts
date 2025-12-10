import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { OperLog } from '../../../entities/oper-log.entity';
import {
  QueryOperLogDto,
  OperLogDataDto,
  BusinessType,
  OperatorType,
  OperStatus
} from './dto/oper-log.dto';

@Injectable()
export class OperLogService {
  constructor(
    @InjectRepository(OperLog)
    private operLogRepository: Repository<OperLog>,
  ) {}

  /**
   * 查询操作日志列表
   * @param query 查询参数
   * @returns 操作日志列表
   */
  async findAll(query: QueryOperLogDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      operIp,
      title,
      operName,
      businessType,
      status,
      orderByColumn = 'operTime',
      isAsc = 'desc',
    } = query;

    const where: any = {};

    if (operIp) {
      where.operIp = Like(`%${operIp}%`);
    }

    if (title) {
      where.title = Like(`%${title}%`);
    }

    if (operName) {
      where.operName = Like(`%${operName}%`);
    }

    if (businessType) {
      where.businessType = businessType;
    }

    if (status !== undefined) {
      where.status = +status;
    }

    // 处理时间范围查询
    let beginTime, endTime;
    if (query['params[beginTime]'] && query['params[endTime]']) {
      beginTime = query['params[beginTime]'];
      endTime = query['params[endTime]'];
      where.operTime = Between(beginTime, endTime);
    }

    // 构建排序条件
    const order: any = {};
    if (orderByColumn) {
      order[orderByColumn] = isAsc === 'asc' ? 'ASC' : 'DESC';
    } else {
      order.operTime = 'DESC';
    }

    const [operLogs, total] = await this.operLogRepository.findAndCount({
      where,
      order,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    const operLogDataDtos: OperLogDataDto[] = operLogs.map(log => ({
      ...log,
      operTime: log.operTime?.toISOString(),
    }));

    return {
      operLogs: operLogDataDtos,
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 删除操作日志
   * @param operIds 操作日志ID数组
   */
  async delete(operIds: number[]) {
    for (const operId of operIds) {
      const operLog = await this.operLogRepository.findOne({
        where: { operId }
      });

      if (!operLog) {
        throw new UnauthorizedException('操作日志不存在');
      }
    }

    await this.operLogRepository.delete(operIds);
  }

  /**
   * 清空操作日志
   */
  async clean() {
    // 删除所有操作日志
    const result = await this.operLogRepository.delete({});
    return { deletedCount: result.affected || 0 };
  }

  /**
   * 记录操作日志
   * @param logData 日志数据
   */
  async create(logData: Partial<OperLog>) {
    const operLog = this.operLogRepository.create({
      ...logData,
      tenantId: '000000', // 默认租户
      operTime: new Date(),
    });

    const savedLog = await this.operLogRepository.save(operLog);
    return savedLog;
  }

  /**
   * 异步记录操作日志
   * @param logData 日志数据
   */
  async createAsync(logData: Partial<OperLog>) {
    // 异步记录，不返回结果
    try {
      await this.create(logData);
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }

  /**
   * 获取业务类型列表
   * @returns 业务类型列表
   */
  getBusinessTypes() {
    return [
      { label: '其它', value: BusinessType.OTHER },
      { label: '新增', value: BusinessType.INSERT },
      { label: '修改', value: BusinessType.UPDATE },
      { label: '删除', value: BusinessType.DELETE },
      { label: '授权', value: BusinessType.GRANT },
      { label: '导出', value: BusinessType.EXPORT },
      { label: '导入', value: BusinessType.IMPORT },
      { label: '强退', value: BusinessType.FORCE },
      { label: '生成代码', value: BusinessType.GENCODE },
      { label: '清空数据', value: BusinessType.CLEAN },
    ];
  }

  /**
   * 获取操作类别列表
   * @returns 操作类别列表
   */
  getOperatorTypes() {
    return [
      { label: '其它', value: OperatorType.OTHER },
      { label: '后台用户', value: OperatorType.BACKEND },
      { label: '手机端用户', value: OperatorType.MOBILE },
    ];
  }

  /**
   * 获取操作状态列表
   * @returns 操作状态列表
   */
  getOperStatuses() {
    return [
      { label: '正常', value: OperStatus.NORMAL },
      { label: '异常', value: OperStatus.ABNORMAL },
    ];
  }
}