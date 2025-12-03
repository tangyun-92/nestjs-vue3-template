import { InjectRepository } from "@nestjs/typeorm";
import { Menu } from "src/entities/menu.entity";
import { Repository } from "typeorm";
import { UserDataBaseDto } from "src/modules/user/dto/user.dto";

// 定义带有children的菜单类型
interface MenuWithChildren extends Menu {
  children: MenuWithChildren[];
}

export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  /**
   * 获取用户菜单
   * @param UserDataBaseDto 用户信息
   * @returns 菜单列表
   */
  async getRouters(UserDataBaseDto: UserDataBaseDto) {
    const { user_name } = UserDataBaseDto;
    if (user_name === "admin") {
      // 先不加条件查询所有菜单数据，看看数据库中有什么
      const allMenus = await this.menuRepository.find();

      // 再按条件查询
      const menus = await this.menuRepository.find({
        where: {
          status: '0', // 正常状态
          visible: '0' // 显示状态
        },
        order: {
          parent_id: 'ASC',
          order_num: 'ASC'
        }
      });

      // 转换为路由格式
      const routes = this.buildRoutes(menus);
      return routes;
    }
    return [];
  }

  /**
   * 将菜单数据转换为路由格式
   * @param menus 菜单数据
   * @returns 路由数组
   */
  private buildRoutes(menus: Menu[]): any[] {
    // 构建菜单树
    const menuMap = new Map<string, MenuWithChildren>();
    const rootMenus: MenuWithChildren[] = [];

    // 创建菜单映射
    menus.forEach(menu => {
      menuMap.set(String(menu.menu_id), {
        ...menu,
        children: []
      });
    });

    // 构建树形结构
    menus.forEach(menu => {
      const menuItem = menuMap.get(String(menu.menu_id));
      if (!menuItem) {
        return;
      }

      // 使用字符串进行比较，确保类型一致
      if (String(menu.parent_id) === '0') {
        rootMenus.push(menuItem);
      } else {
        const parent = menuMap.get(String(menu.parent_id));
        if (parent) {
          parent.children.push(menuItem);
        }
      }
    });

    // 转换为路由格式
    const routes = rootMenus.filter(menu => menu !== undefined).map(menu => this.menuToRoute(menu));
    return routes;
  }

  /**
   * 将单个菜单转换为路由格式
   * @param menu 菜单数据
   * @returns 路由对象
   */
  private menuToRoute(menu: MenuWithChildren): any {
    // 生成路由名称：path + menu_id，首字母大写
    const routeName = (menu.path || '') + menu.menu_id;
    const capitalizedName = routeName.charAt(0).toUpperCase() + routeName.slice(1);

    // 根据parent_id决定path前缀
    const routePath = menu.path ? (String(menu.parent_id) === '0' ? `/${menu.path}` : menu.path) : '';

    const route: any = {
      name: capitalizedName,
      path: routePath,
      hidden: menu.visible === '1',
      component: this.getComponent(menu),
      meta: {
        title: menu.menu_name,
        icon: menu.icon,
        noCache: menu.is_cache === 1,
        link: null,
        activeMenu: null
      }
    };

    // 添加其他属性
    if (menu.query_param) {
      route.query = menu.query_param;
    }

    if (Number(menu.is_frame) === 1) {
      route.meta.link = menu.path;
    }

    if (Number(menu.parent_id) === 0 && menu.menu_type === 'M') {
      route.redirect = "noRedirect";
      route.alwaysShow = true;
    }

    // 处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children
        .filter((child: MenuWithChildren) => child.menu_type !== 'F') // 过滤掉按钮类型
        .map((child: MenuWithChildren) => this.menuToRoute(child));
    }

    return route;
  }

  /**
   * 获取组件路径
   * @param menu 菜单数据
   * @returns 组件路径
   */
  private getComponent(menu: Menu): string {
    if (menu.menu_type === 'M') {
      return 'Layout';
    }

    if (menu.menu_type === 'C') {
      return menu.component || 'ParentView';
    }

    return menu.component || 'Layout';
  }
}