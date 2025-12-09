// 查询公告参数DTO
export interface QueryNoticeDto {
  pageNum?: number;
  pageSize?: number;
  noticeTitle?: string;
  createByName?: string;
  status?: string;
  noticeType?: string;
}

// 创建公告DTO
export interface CreateNoticeDto {
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status?: string;
  remark?: string;
}

// 更新公告DTO
export interface UpdateNoticeDto {
  noticeId: number;
  noticeTitle?: string;
  noticeType?: string;
  noticeContent?: string;
  status?: string;
  remark?: string;
}

// 公告响应DTO
export interface NoticeDataDto {
  noticeId: number;
  tenantId: string;
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status: string;
  createDept?: number;
  createBy?: number;
  updateBy?: number;
  createTime: string | Date;
  updateTime: string | Date;
  remark?: string;
  createByName?: string;
}

// 公告状态枚举
export enum NoticeStatus {
  NORMAL = '0',  // 正常
  DISABLED = '1',  // 关闭
}

// 公告类型枚举
export enum NoticeType {
  NOTICE = '1',   // 通知
  ANNOUNCEMENT = '2',  // 公告
}