// 查询登录日志参数DTO
export interface QueryLoginInfoDto {
  pageNum?: number;
  pageSize?: number;
  ipaddr?: string;
  userName?: string;
  status?: string;
  orderByColumn?: string;
  isAsc?: string;
}

// 登录日志响应DTO
export interface LoginInfoDataDto {
  infoId: number;
  tenantId: string;
  userName: string;
  status: number;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  msg: string;
  loginTime: string | Date;
  createTime: string | Date;
}

// 登录状态枚举
export enum LoginStatus {
  SUCCESS = 0,      // 成功
  FAIL = 1,         // 失败
}