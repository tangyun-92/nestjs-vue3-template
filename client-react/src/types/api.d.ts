/**
 * 全局 API 类型定义
 */
declare namespace API {
  /**
   * 统一响应结构（NestJS 后台）
   */
  type ResponseStructure<T = any> = {
    code: number;
    result: boolean;
    data: T;
    message: string;
  };

  /**
   * 分页响应结构（NestJS 后台）
   */
  type PaginationResponse<T = any> = {
    code: number;
    result: boolean;
    rows: T[];
    total: number;
    message: string;
  };

  /**
   * 当前用户信息
   */
  type CurrentUser = {
    userId?: number;
    userName?: string;
    nickName?: string;
    avatar?: string;
    email?: string;
    phonenumber?: string;
    sex?: string;
    status?: string;
    roles?: string[];
    permissions?: string[];
  };

  /**
   * 登录参数
   */
  type LoginParams = {
    username: string;
    password: string;
  };
}
