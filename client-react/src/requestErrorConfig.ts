import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';
import { history } from '@umijs/max';

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

// 与后端约定的响应数据格式（NestJS 后台）
interface ResponseStructure {
  code: number;
  result: boolean;
  data?: any;
  rows?: any[];
  total?: number;
  message: string;
  showType?: ErrorShowType;
}

// Token 存储的 key
const TOKEN_KEY = 'access_token';

/**
 * 获取本地存储的 Token
 */
const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 保存 Token 到本地存储
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除 Token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * @name 错误处理
 * 基于 NestJS 后台接口的统一响应格式
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { code, result, data, message: errorMessage, showType } =
        res as unknown as ResponseStructure;

      // 判断请求是否成功（后台返回 result: false 或 code !== 200 表示失败）
      if (!result || code !== 200) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = {
          code,
          errorMessage,
          showType: showType || ErrorShowType.ERROR_MESSAGE,
          data
        };
        throw error; // 抛出自制的错误
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // 我们的 errorThrower 抛出的错误。
      if (error.name === 'BizError') {
        const errorInfo = error.info;
        if (errorInfo) {
          const { errorMessage, code } = errorInfo;

          // 401 未授权，跳转登录页
          if (code === 401) {
            clearToken();
            message.error(errorMessage || 'Token无效或已过期，请重新登录');
            if (history.location.pathname !== '/user/login') {
              history.push('/user/login');
            }
            return;
          }

          // 500 服务器错误，显示后端返回的具体错误信息
          if (code === 500) {
            message.error(errorMessage || '服务器内部错误');
            return;
          }

          // 根据 showType 显示错误信息
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.error({
                message: `请求错误 ${code}`,
                description: errorMessage,
              });
              break;
            case ErrorShowType.REDIRECT:
              clearToken();
              history.push('/user/login');
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // Axios 的错误
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        const { status, statusText, data } = error.response;

        // 尝试从响应中提取后端返回的错误信息
        let errorMsg = '';
        if (data && typeof data === 'object' && data.message) {
          errorMsg = data.message;
        }

        // 处理 HTTP 状态码错误
        if (status === 401) {
          clearToken();
          message.error(errorMsg || '登录已过期，请重新登录');
          history.push('/user/login');
        } else if (status === 403) {
          message.error(errorMsg || '您没有权限访问该资源');
        } else if (status === 404) {
          message.error(errorMsg || '请求的资源不存在');
        } else if (status === 500) {
          message.error(errorMsg || '服务器内部错误');
        } else {
          message.error(errorMsg || `请求错误 ${status}: ${statusText}`);
        }
      } else if (error.request) {
        // 请求已经成功发起，但没有收到响应
        message.error('网络异常，请检查网络连接后重试');
      } else {
        // 发送请求时出了点问题
        message.error('请求失败，请稍后重试');
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 添加 Authorization 请求头
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // 添加其他自定义请求头
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };

      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // 拦截响应数据，进行个性化处理
      const { data } = response as any;

      // 处理后台返回的统一响应格式
      if (data && typeof data === 'object') {
        const { code, result, message: msg } = data as ResponseStructure;

        // 成功响应，可以选择性显示成功消息（默认不显示）
        if (result && code === 200) {
          // 如果需要显示成功消息，可以在这里处理
          // message.success(msg);
        }

        // 特殊处理：登录成功后保存 token
        if (result && data.data?.access_token) {
          setToken(data.data.access_token);
        }
      }

      return response;
    },
  ],
};
