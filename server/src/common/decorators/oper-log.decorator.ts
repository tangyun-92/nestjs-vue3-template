import { SetMetadata } from '@nestjs/common';
import { BusinessType } from '../../modules/monitor/operlog/dto/oper-log.dto';

/**
 * 操作日志装饰器
 * @param title 操作标题
 * @param businessType 业务类型
 * @param operatorType 操作类别
 */
export const OperLog = (
  title?: string,
  businessType: BusinessType = BusinessType.OTHER,
  operatorType: number = 1,
) => {
  return SetMetadata('operLog', {
    title,
    businessType,
    operatorType,
  });
};

// 便捷的装饰器函数
export const LogSelect = (title?: string) => OperLog(title || '查询', BusinessType.SELECT);
export const LogInsert = (title?: string) => OperLog(title || '新增', BusinessType.INSERT);
export const LogUpdate = (title?: string) => OperLog(title || '修改', BusinessType.UPDATE);
export const LogDelete = (title?: string) => OperLog(title || '删除', BusinessType.DELETE);
export const LogExport = (title?: string) => OperLog(title || '导出', BusinessType.EXPORT);
export const LogImport = (title?: string) => OperLog(title || '导入', BusinessType.IMPORT);
export const LogGrant = (title?: string) => OperLog(title || '授权', BusinessType.GRANT);
export const LogClean = (title?: string) => OperLog(title || '清空', BusinessType.CLEAN);
export const LogGenCode = (title?: string) => OperLog(title || '生成代码', BusinessType.GENCODE);