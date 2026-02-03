import { request } from '@umijs/max';

/**
 * 获取路由菜单
 */
export async function getRouters() {
  return request('/system/menu/getRouters', {
    method: 'GET',
  });
}
