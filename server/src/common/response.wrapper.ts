/**
 * 统一响应包装器
 * 用于统一接口返回格式
 */
export class ResponseWrapper {
  /**
   * 成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param code 状态码
   */
  static success<T>(
    data: T | null = null,
    message: string = '操作成功',
    code: number = 200,
  ) {
    return {
      code,
      result: true,
      data,
      message,
    };
  }

  /**
   * 失败响应
   * @param message 错误消息
   * @param code 状态码
   */
  static error(message: string = '操作失败', code: number = 400) {
    return {
      code,
      result: false,
      data: null,
      message,
    };
  }

  /**
   * 分页数据成功响应
   * @param items 数据列表
   * @param total 总数
   * @param page 当前页
   * @param pageSize 每页大小
   * @param message 响应消息
   */
  static successWithPagination<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message: string = '获取数据成功',
  ) {
    return {
      code: 200,
      result: true,
      rows: items,
      total,
      // data: {
      //   items,
      //   total,
      //   page,
      //   pageSize,
      // },
      message,
    };
  }
}
