import { Injectable } from '@nestjs/common';
import { OperLog } from '../../entities/oper-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * 操作日志服务（中间件使用的简化版本）
 */
@Injectable()
export class OperLogMiddlewareService {
  constructor(
    @InjectRepository(OperLog)
    private operLogRepository: Repository<OperLog>,
  ) {}

  /**
   * 异步记录操作日志
   * @param logData 日志数据
   */
  async createAsync(logData: Partial<OperLog>) {
    try {
      const operLog = this.operLogRepository.create(logData);
      await this.operLogRepository.save(operLog);
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }
}