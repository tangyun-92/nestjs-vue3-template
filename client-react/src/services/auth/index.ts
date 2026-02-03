import { request } from '@umijs/max';

/**
 * 登录响应数据
 */
export interface LoginResponse {
  access_token: string;
  user?: any;
}

/**
 * 用户信息响应
 */
export interface UserInfoResponse {
  user: {
    userId: number;
    userName: string;
    nickName: string;
    email?: string;
    phonenumber?: string;
    sex?: string;
    avatar?: string;
    status: string;
    delFlag?: string;
    loginIp?: string;
    loginDate?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
    remark?: string;
  };
  roles: string[];
  permissions: string[];
}

/**
 * 登录接口
 * @param data 登录参数
 */
export async function login(data: API.LoginParams) {
  return request<API.ResponseStructure<LoginResponse>>('/auth/login', {
    method: 'POST',
    data,
  });
}

/**
 * 获取用户信息
 */
export async function getUserInfo(options?: { [key: string]: any }) {
  return request<API.ResponseStructure<UserInfoResponse>>('/auth/getInfo', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 退出登录
 */
export async function logout() {
  return request<API.ResponseStructure<any>>('/auth/logout', {
    method: 'POST',
  });
}
