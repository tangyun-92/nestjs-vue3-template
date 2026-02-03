import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import { getUserInfo } from '@/services/auth';
import { getRouters } from '@/services/menu';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import routes from '../config/routes';
import '@ant-design/v5-patch-for-react-19';

const isDev =
  process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

/**
 * 将固定路由配置转换为菜单格式
 * 过滤掉不需要在菜单中显示的路由（如 /user、404、redirect 等）
 * 注意：当 menu.locale: true 时，ProLayout 会自动处理国际化
 * name 字段应该直接使用路由的 name（如 'dashboard'），ProLayout 会自动查找 'menu.dashboard' 的翻译
 */
const convertRoutesToMenus = (routesConfig: any[], parentPath: string = ''): any[] => {
  return routesConfig
    .filter((route) => {
      // 过滤掉不需要显示的路由
      if (route.layout === false) return false; // 登录页等不需要显示
      if (route.path === '/user') return false; // 用户相关路由
      if (route.path === '/*') return false; // 404 路由
      if (route.path === '/' && route.redirect) return false; // 根路径重定向
      if (!route.name && !route.routes) return false; // 没有名称且没有子路由的不显示
      if (route.redirect && !route.routes) return false; // 纯重定向路由不显示
      return true;
    })
    .map((route) => {
      // 构建国际化 key：当 menu.locale: true 时，ProLayout 会自动添加 'menu.' 前缀
      // 所以这里 name 字段直接使用路由的 name（如 'dashboard'），ProLayout 会自动查找 'menu.dashboard'
      // 对于子路由，使用点号连接（如 'dashboard.analysis'），ProLayout 会查找 'menu.dashboard.analysis'
      let menuKey = '';
      if (parentPath) {
        menuKey = `${parentPath}.${route.name}`;
      } else {
        menuKey = route.name; // 直接使用路由的 name，ProLayout 会自动添加 'menu.' 前缀
      }
      
      const menuItem: any = {
        path: route.path,
        name: menuKey, // 使用国际化 key，ProLayout 会自动处理翻译
        icon: route.icon,
      };
      
      // 如果有子路由，递归处理
      if (route.routes && route.routes.length > 0) {
        const children = convertRoutesToMenus(route.routes, menuKey);
        if (children.length > 0) {
          menuItem.children = children;
        }
      }
      
      return menuItem;
    });
};

/**
 * 获取菜单数据
 */
const fetchMenus = async () => {
  try {
    const response = await getRouters();
    // 兼容处理：后端可能直接返回数组，也可能返回 { data: [...] }
    let menus = [];
    if (Array.isArray(response)) {
      menus = response;
    } else if (response && Array.isArray(response.data)) {
      menus = response.data;
    } else if (response?.result && Array.isArray(response.data)) {
      menus = response.data;
    }
    return menus;
  } catch (error) {
    return [];
  }
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  menus?: any[];
}> {
  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo({
        skipErrorHandler: true,
      });
      if (response.result && response.data) {
        const { user, roles, permissions } = response.data;
        const userInfo: API.CurrentUser = {
          userId: user.userId,
          name: user.nickName || user.userName, // 增加 name 字段映射
          userName: user.userName,
          nickName: user.nickName,
          avatar: user.avatar,
          email: user.email,
          phonenumber: user.phonenumber,
          sex: user.sex,
          status: user.status,
          roles,
          permissions,
        };
        return userInfo;
      }
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  const token = localStorage.getItem('access_token');
  
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    ) || token
  ) {
    const currentUser = await fetchUserInfo();
    
    // 如果用户已登录，同时获取菜单数据
    let menus = [];
    if (currentUser) {
      menus = await fetchMenus();
    }
    return {
      fetchUserInfo,
      currentUser,
      menus,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
      // 如果已经登录，且在登录页，重定向到首页
      if (initialState?.currentUser && location.pathname === loginPath) {
        history.push('/');
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    menu: {
      locale: true, // 启用国际化，ProLayout 会自动处理菜单的国际化翻译
      // 添加 key，当 currentUser 变化时强制重新请求菜单
      params: {
        userId: initialState?.currentUser?.userId,
      },
      request: async (params, defaultMenuData) => {
        // 只有登录了才请求菜单
        if (!initialState?.currentUser) {
          return [];
        }

        // 获取固定路由菜单（从 routes.ts 配置中提取）
        const fixedMenus = convertRoutesToMenus(routes);

        // 转换后端菜单数据为 ProLayout 支持的格式
        const mapMenu = (data: any[]): any[] => {
          return data.map(item => {
            return {
              path: item.path,
              name: item.meta?.title || item.name,
              icon: item.meta?.icon,
              hideInMenu: item.hidden,
              children: item.children ? mapMenu(item.children) : undefined,
            };
          });
        };

        // 获取动态路由菜单
        let dynamicMenus: any[] = [];
        
        // 如果 initialState 中已经有菜单数据，优先使用（避免重复请求）
        if (initialState?.menus && initialState.menus.length > 0) {
          dynamicMenus = mapMenu(initialState.menus);
        } else {
          // 否则请求菜单接口
          try {
            const response = await getRouters();

            // 兼容处理：后端可能直接返回数组，也可能返回 { data: [...] }
            let menus = [];
            if (Array.isArray(response)) {
              menus = response;
            } else if (response && Array.isArray(response.data)) {
              menus = response.data;
            } else if (response?.result && Array.isArray(response.data)) {
              menus = response.data;
            }

            // 更新 initialState 中的菜单数据
            setInitialState((preState) => ({
              ...preState,
              menus,
            }));

            dynamicMenus = mapMenu(menus);
          } catch (error) {
            // 即使动态菜单获取失败，也返回固定菜单
          }
        }

        // 合并固定路由和动态路由：固定路由在前，动态路由在后
        const mergedMenus = [...fixedMenus, ...dynamicMenus];
        return mergedMenus;
      },
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // 统一在 baseURL 中添加 /dev-api 前缀
  // 开发环境使用代理，生产环境使用实际地址
  baseURL: process.env.NODE_ENV === 'development' ? '/dev-api' : 'http://127.0.0.1:3123/dev-api',
  timeout: 10000,
  ...errorConfig,
};
