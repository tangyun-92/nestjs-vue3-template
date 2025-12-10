// 查询操作日志参数DTO
export interface QueryOperLogDto {
  pageNum?: number;
  pageSize?: number;
  operIp?: string;
  title?: string;
  operName?: string;
  businessType?: string;
  status?: string;
  orderByColumn?: string;
  isAsc?: string;
}

// 操作日志响应DTO
export interface OperLogDataDto {
  operId: number;
  tenantId: string;
  title: string;
  businessType: number;
  method: string;
  requestMethod: string;
  operatorType: number;
  operName: string;
  deptName: string;
  operUrl: string;
  operIp: string;
  operLocation: string;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string;
  operTime: string | Date;
  costTime: number;
}

// 业务类型枚举
export enum BusinessType {
  OTHER = 0,      // 其它
  INSERT = 1,    // 新增
  UPDATE = 2,    // 修改
  DELETE = 3,    // 删除
  GRANT = 4,     // 授权
  EXPORT = 5,    // 导出
  IMPORT = 6,    // 导入
  FORCE = 7,     // 强退
  GENCODE = 8,   // 生成代码
  CLEAN = 9,     // 清空数据
  SELECT = 10,   // 查询
}

// 操作类别枚举
export enum OperatorType {
  OTHER = 0,      // 其它
  BACKEND = 1,     // 后台用户
  MOBILE = 2,      // 手机端用户
}

// 操作状态枚举
export enum OperStatus {
  NORMAL = 0,      // 正常
  ABNORMAL = 1,     // 异常
}