import { Controller, Delete, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperLogService } from './oper-log.service';
import type { QueryOperLogDto } from './dto/oper-log.dto';
import { ResponseWrapper } from '../../../common/response.wrapper';

@UseGuards(JwtAuthGuard)
@Controller('monitor/operlog')
export class OperLogController {
  constructor(private readonly operLogService: OperLogService) {}

  /**
   * 查询操作日志列表
   * @param query 查询参数
   * @returns 分页操作日志列表
   */
  @Get('list')
  async list(@Query() query: QueryOperLogDto) {
    const { operLogs, total, pageNum, pageSize } = await this.operLogService.findAll(query);
    return ResponseWrapper.successWithPagination(
      operLogs,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 删除操作日志
   * @param operId 操作日志ID（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':operId')
  async delete(@Param('operId') operId: string) {
    const ids = operId.split(',').map(id => +id);
    await this.operLogService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 清空操作日志
   * @returns 清空结果
   */
  @Delete('clean')
  async clean() {
    const result = await this.operLogService.clean();
    return ResponseWrapper.success(result, '清空成功');
  }
}