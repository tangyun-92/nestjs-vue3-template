import { InjectRepository } from "@nestjs/typeorm";
import { Menu } from "src/entities/menu.entity";
import { Repository } from "typeorm";
import { UserDataBaseDto } from "src/modules/user/dto/user.dto";
import { QueryMenuDto } from "./dto/menu.dto";

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
    const { userName } = UserDataBaseDto;
    if (userName === 'admin') {
      // 先不加条件查询所有菜单数据，看看数据库中有什么
      const allMenus = await this.menuRepository.find();

      // 再按条件查询
      const menus = await this.menuRepository.find({
        where: {
          status: '0', // 正常状态
          visible: '0', // 显示状态
        },
        order: {
          parentId: 'ASC',
          orderNum: 'ASC',
        },
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
      menuMap.set(String(menu.menuId), {
        ...menu,
        children: []
      });
    });

    // 构建树形结构
    menus.forEach(menu => {
      const menuItem = menuMap.get(String(menu.menuId));
      if (!menuItem) {
        return;
      }

      // 使用字符串进行比较，确保类型一致
      if (String(menu.parentId) === '0') {
        rootMenus.push(menuItem);
      } else {
        const parent = menuMap.get(String(menu.parentId));
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
    // 生成路由名称：path + menuId，首字母大写
    const routeName = (menu.path || '') + menu.menuId;
    const capitalizedName = routeName.charAt(0).toUpperCase() + routeName.slice(1);

    // 根据parentId决定path前缀
    const routePath = menu.path ? (String(menu.parentId) === '0' ? `/${menu.path}` : menu.path) : '';

    const route: any = {
      name: capitalizedName,
      path: routePath,
      hidden: menu.visible === '1',
      component: this.getComponent(menu),
      meta: {
        title: menu.menuName,
        icon: menu.icon,
        noCache: menu.isCache === 1,
        link: null,
        activeMenu: null
      }
    };

    // 添加其他属性
    if (menu.queryParam) {
      route.query = menu.queryParam;
    }

    // if (Number(menu.isFrame) === 1) {
    //   route.meta.link = menu.path;
    // }

    if (Number(menu.parentId) === 0 && menu.menuType === 'M') {
      route.redirect = "noRedirect";
      route.alwaysShow = true;
    }

    // 处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children
        .filter((child: MenuWithChildren) => child.menuType !== 'F') // 过滤掉按钮类型
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
    if (menu.menuType === 'M') {
      return 'Layout';
    }

    if (menu.menuType === 'C') {
      return menu.component || 'ParentView';
    }

    return menu.component || 'Layout';
  }

  async findAll(queryMenuDto: QueryMenuDto) {
    const { menuName, status } = queryMenuDto;

    const queryBuilder = this.menuRepository.createQueryBuilder('menu');

    if (menuName) {
      queryBuilder.andWhere('menu.menuName LIKE :menuName', {
        menuName: `%${menuName}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('menu.status = :status', { status });
    }

    const menus = await queryBuilder
      .orderBy('menu.createTime', 'DESC')
      .getMany();

    return {
      menus
    }
  }
}