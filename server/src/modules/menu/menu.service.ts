import { InjectRepository } from "@nestjs/typeorm";
import { Menu } from "src/entities/menu.entity";
import { Repository, Like, Not } from "typeorm";
import { UserDataBaseDto } from "src/modules/user/dto/user.dto";
import { QueryMenuDto, CreateMenuDto, UpdateMenuDto, MenuTreeOptionDto, RoleMenuTreeDto } from "./dto/menu.dto";
import { Inject, forwardRef, Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "src/entities/user.entity";
import { UserRole } from "src/entities/user-role.entity";
import { RoleMenu } from "src/entities/role-menu.entity";
import { Role } from "src/entities/role.entity";
import { In } from "typeorm";

// 定义带有children的菜单类型
interface MenuWithChildren extends Menu {
  children: MenuWithChildren[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RoleMenu)
    private roleMenuRepository: Repository<RoleMenu>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 获取用户菜单
   * @param UserDataBaseDto 用户信息
   * @returns 菜单列表
   */
  async getRouters(UserDataBaseDto: UserDataBaseDto) {
    const { userName } = UserDataBaseDto;
    console.log('getRouters', UserDataBaseDto);

    // 1. 查找用户ID
    const user = await this.userRepository.findOne({
      where: { userName },
      select: ['userId']
    });

    if (!user) {
      return [];
    }

    // 2. 查找用户的角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.userId },
      select: ['roleId']
    });

    if (userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map(ur => ur.roleId);

    // 3. 查找用户的角色信息，判断是否有超级管理员角色
    const roles = await this.roleRepository.find({
      where: {
        roleId: In(roleIds),
        status: '0', // 正常状态
        delFlag: '0', // 未删除
      },
      select: ['roleId', 'roleKey']
    });

    if (roles.length === 0) {
      return [];
    }

    // 4. 判断是否是超级管理员
    const isSuperAdmin = roles.some(role => role.roleKey === 'superadmin');

    // 5. 根据是否是超级管理员决定查询条件
    const menuQuery: any = {
      where: {
        status: '0', // 正常状态
        // visible: '0', // 显示状态
      },
      order: {
        parentId: 'ASC',
        orderNum: 'ASC',
      },
    };

    // 如果不是超级管理员，添加菜单ID条件
    if (!isSuperAdmin) {
      // 查找角色对应的菜单ID
      const roleMenus = await this.roleMenuRepository.find({
        where: { roleId: In(roleIds) },
        select: ['menuId']
      });

      if (roleMenus.length === 0) {
        return [];
      }

      const menuIds = [...new Set(roleMenus.map(rm => rm.menuId))];
      menuQuery.where.menuId = In(menuIds);
    }

    // 6. 查询菜单
    const menus = await this.menuRepository.find(menuQuery);

    // 7. 转换为路由格式
    return this.buildRoutes(menus);
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
    const { keywords, menuName, status } = queryMenuDto;

    const where: any = {};

    if (keywords) {
      where.menuName = Like(`%${keywords}%`);
    } else if (menuName) {
      where.menuName = Like(`%${menuName}%`);
    }

    if (status) {
      where.status = status;
    }

    const menus = await this.menuRepository.find({
      where,
      order: {
        orderNum: 'ASC',
        menuId: 'ASC'
      }
    });

    // 构建树形结构
    const menuTree = this.buildMenuTree(menus);

    return {
      menus: menuTree
    };
  }

  /**
   * 构建菜单树
   * @param menus 菜单列表
   * @param parentId 父级ID
   * @returns 树形结构
   */
  private buildMenuTree(menus: Menu[], parentId: number = 0): Menu[] {
    return menus
      .filter(menu => +menu.parentId === +parentId)
      .map(menu => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.menuId)
      }));
  }

  /**
   * 根据ID查找菜单
   * @param menuId 菜单ID
   * @returns 菜单信息
   */
  async findOne(menuId: number) {
    return await this.menuRepository.findOne({
      where: { menuId },
    });
  }

  /**
   * 获取子菜单
   * @param parentId 父级菜单ID
   * @returns 子菜单列表
   */
  async getChildren(parentId: number) {
    return await this.menuRepository.find({
      where: { parentId },
      order: {
        orderNum: 'ASC',
      },
    });
  }

  /**
   * 新增菜单
   * @param createMenuDto 菜单数据
   * @returns 创建的菜单
   */
  async create(createMenuDto: CreateMenuDto) {
    // 转换数据类型以匹配实体
    const createData: any = { ...createMenuDto };
    if (createMenuDto.isFrame !== undefined) {
      createData.isFrame = createMenuDto.isFrame === '1' ? 1 : 0;
    }
    if (createMenuDto.isCache !== undefined) {
      createData.isCache = createMenuDto.isCache === '1' ? 1 : 0;
    }
    if (createMenuDto.visible !== undefined) {
      createData.visible = createMenuDto.visible === '0' ? '0' : '1';
    }
    if (createMenuDto.status !== undefined) {
      createData.status = createMenuDto.status === '0' ? '0' : '1';
    }

    const menu = this.menuRepository.create(createData);
    const savedMenu = await this.menuRepository.save(menu);

    // save 方法可能返回数组或单个对象，处理两种情况
    const result = Array.isArray(savedMenu) ? savedMenu[0] : savedMenu;

    return {
      ...result,
      createTime: result.createTime?.toISOString(),
      updateTime: result.updateTime?.toISOString(),
    };
  }

  /**
   * 修改菜单
   * @param updateMenuDto 菜单数据
   * @returns 更新的菜单
   */
  async update(updateMenuDto: UpdateMenuDto) {
    const menu = await this.menuRepository.findOne({
      where: { menuId: updateMenuDto.menuId }
    });

    if (!menu) {
      throw new UnauthorizedException('菜单不存在');
    }

    // 检查是否修改了父级
    if (updateMenuDto.parentId !== undefined && updateMenuDto.parentId !== menu.parentId) {
      // 不能将菜单设置为自己的子菜单
      if (updateMenuDto.parentId === updateMenuDto.menuId) {
        throw new UnauthorizedException('上级菜单不能是自己');
      }

      // 检查是否将菜单设置为自己的子孙菜单
      const childMenus = await this.findChildMenus(updateMenuDto.menuId);
      const childIds = childMenus.map(m => m.menuId);
      if (childIds.includes(updateMenuDto.parentId)) {
        throw new UnauthorizedException('上级菜单不能是自己的子菜单');
      }
    }

    // 转换数据类型以匹配实体
    const updateData: any = { ...updateMenuDto };
    if (updateMenuDto.isFrame !== undefined) {
      updateData.isFrame = updateMenuDto.isFrame === '1' ? 1 : 0;
    }
    if (updateMenuDto.isCache !== undefined) {
      updateData.isCache = updateMenuDto.isCache === '1' ? 1 : 0;
    }
    if (updateMenuDto.visible !== undefined) {
      updateData.visible = updateMenuDto.visible === '0' ? '0' : '1';
    }
    if (updateMenuDto.status !== undefined) {
      updateData.status = updateMenuDto.status === '0' ? '0' : '1';
    }

    await this.menuRepository.update(updateMenuDto.menuId, updateData);

    const updatedMenu = await this.menuRepository.findOne({
      where: { menuId: updateMenuDto.menuId }
    });

    if (!updatedMenu) {
      throw new UnauthorizedException('更新失败，菜单不存在');
    }

    return {
      ...updatedMenu,
      createTime: updatedMenu.createTime?.toISOString(),
      updateTime: updatedMenu.updateTime?.toISOString(),
    };
  }

  /**
   * 删除菜单
   * @param menuId 菜单ID
   */
  async delete(menuId: number) {
    // 检查是否有子菜单
    const childMenu = await this.menuRepository.findOne({
      where: { parentId: menuId }
    });

    if (childMenu) {
      throw new UnauthorizedException('存在子菜单,不允许删除');
    }

    const menu = await this.menuRepository.findOne({
      where: { menuId }
    });

    if (!menu) {
      throw new UnauthorizedException('菜单不存在');
    }

    await this.menuRepository.delete(menuId);
  }

  /**
   * 级联删除菜单
   * @param menuIds 菜单ID数组
   */
  async cascadeDelete(menuIds: number[]) {
    for (const menuId of menuIds) {
      const menu = await this.menuRepository.findOne({
        where: { menuId }
      });

      if (!menu) {
        throw new UnauthorizedException('菜单不存在');
      }
    }

    // 递归删除所有子菜单
    for (const menuId of menuIds) {
      await this.deleteMenuAndChildren(menuId);
    }
  }

  /**
   * 递归删除菜单及其子菜单
   * @param menuId 菜单ID
   */
  private async deleteMenuAndChildren(menuId: number) {
    const children = await this.menuRepository.find({
      where: { parentId: menuId }
    });

    for (const child of children) {
      await this.deleteMenuAndChildren(child.menuId);
    }

    await this.menuRepository.delete(menuId);
  }

  /**
   * 查询菜单下拉树结构
   * @returns 菜单树
   */
  async findMenuTree(): Promise<MenuTreeOptionDto[]> {
    const menus = await this.menuRepository.find({
      order: {
        orderNum: 'ASC'
      }
    });

    return this.buildTreeOptions(menus);
  }

  /**
   * 根据角色ID查询菜单下拉树结构
   * @param roleId 角色ID
   * @returns 菜单树和选中的菜单ID
   */
  async findRoleMenuTree(roleId: number): Promise<RoleMenuTreeDto> {
    // 查询所有菜单
    const menus = await this.menuRepository.find({
      order: {
        orderNum: 'ASC'
      }
    });

    // 查询角色已分配的菜单
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId }
    });

    const checkedKeys = roleMenus.map(rm => rm.menuId);

    return {
      menus: this.buildTreeOptions(menus),
      checkedKeys
    };
  }

  /**
   * 根据租户套餐ID查询菜单下拉树结构
   * @param packageId 套餐ID
   * @returns 菜单树和选中的菜单ID
   */
  async findTenantPackageMenuTree(packageId: number): Promise<RoleMenuTreeDto> {
    // TODO: 实现租户套餐菜单查询
    // 暂时返回所有菜单，无选中项
    const menus = await this.menuRepository.find({
      order: {
        orderNum: 'ASC'
      }
    });

    return {
      menus: this.buildTreeOptions(menus),
      checkedKeys: []
    };
  }

  /**
   * 构建树形选项
   * @param menus 菜单列表
   * @param parentId 父级ID
   * @returns 树形选项
   */
  private buildTreeOptions(menus: Menu[], parentId: number = 0): MenuTreeOptionDto[] {
    return menus
      .filter(menu => menu.parentId === parentId)
      .map(menu => ({
        id: menu.menuId,
        label: menu.menuName,
        parentId: menu.parentId,
        weight: menu.orderNum,
        children: this.buildTreeOptions(menus, menu.menuId)
      }));
  }

  /**
   * 查找子菜单
   * @param parentId 父级ID
   * @returns 子菜单列表
   */
  private async findChildMenus(parentId: number): Promise<Menu[]> {
    const menus = await this.menuRepository.find();

    const findChildren = (pid: number): Menu[] => {
      return menus
        .filter(menu => menu.parentId === pid)
        .flatMap(menu => [menu, ...findChildren(menu.menuId)]);
    };

    return findChildren(parentId);
  }
}